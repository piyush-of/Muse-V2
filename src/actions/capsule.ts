'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateOutfitReasoning } from '@/lib/gemini';
import type { Outfit } from '@/types';
import { revalidatePath } from 'next/cache';

/**
 * Returns today's capsule outfits. Compiles them on-demand using Gemini styling algorithms if missing.
 */
export async function getTodayOutfits() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const userId = session.user.id;
  const todayStr = new Date().toISOString().split('T')[0];

  try {
    // 1. Fetch today's outfits
    let outfits = await prisma.outfit.findMany({
      where: { userId, date: todayStr },
    });

    // 2. If no outfits cached, compile them on-demand
    if (outfits.length === 0) {
      await compileUserDailyCapsule(userId, todayStr);
      outfits = await prisma.outfit.findMany({
        where: { userId, date: todayStr },
      });
    }

    // 3. Populate full garment metadata for each outfit
    const populated: Outfit[] = await Promise.all(
      outfits.map(async (outfit) => {
        const garments = await prisma.closetItem.findMany({
          where: {
            id: { in: outfit.itemIds },
          },
        });
        return {
          ...outfit,
          status: outfit.status as Outfit['status'],
          garments,
        };
      })
    );

    return { success: true, outfits: populated };
  } catch (error: any) {
    console.error('getTodayOutfits error:', error);
    return { success: false, error: error.message || 'Failed to fetch outfits' };
  }
}

/**
 * Accepts an outfit and registers WearEvents for its items.
 */
export async function acceptOutfit(outfitId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const userId = session.user.id;

  try {
    const outfit = await prisma.outfit.findFirst({
      where: { id: outfitId, userId },
    });

    if (!outfit) {
      throw new Error('Outfit suggestion not found');
    }

    await prisma.$transaction(async (tx) => {
      // Set outfit state
      await tx.outfit.update({
        where: { id: outfitId },
        data: { status: 'accepted' },
      });

      // Clear any other accepted outfits for today
      await tx.outfit.updateMany({
        where: {
          userId,
          date: outfit.date,
          id: { not: outfitId },
          status: 'accepted',
        },
        data: { status: 'pending' },
      });

      // Register WearEvents for all items in the accepted outfit
      const eventsData = outfit.itemIds.map(itemId => ({
        userId,
        closetItemId: itemId,
        outfitId,
        wornAt: new Date(),
      }));

      await tx.wearEvent.createMany({
        data: eventsData,
      });
    });

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('acceptOutfit error:', error);
    return { success: false, error: error.message || 'Failed to accept outfit' };
  }
}

/**
 * Rejects an outfit and logs the rejection reasons.
 */
export async function rejectOutfit(outfitId: string, reason: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const userId = session.user.id;

  try {
    const updated = await prisma.outfit.update({
      where: { id: outfitId, userId },
      data: {
        status: 'rejected',
        rejectionReason: reason || 'No reason specified',
      },
    });

    revalidatePath('/dashboard');
    return { success: true, outfit: updated };
  } catch (error: any) {
    console.error('rejectOutfit error:', error);
    return { success: false, error: error.message || 'Failed to reject outfit' };
  }
}

/**
 * Core compiler: Generates 3 distinct outfit combinations.
 */
async function compileUserDailyCapsule(userId: string, dateStr: string) {
  const items = await prisma.closetItem.findMany({ where: { userId } });
  if (items.length === 0) return;

  const weather = 'Cool Autumn (15°C, overcast)';
  const calendarEvent = 'Weekly Product Briefing';

  const outerwear = items.filter(i => i.category === 'Outerwear');
  const tops = items.filter(i => i.category === 'Tops');
  const bottoms = items.filter(i => i.category === 'Bottoms');
  const shoes = items.filter(i => i.category === 'Shoes');

  const getRand = (arr: typeof items) => (arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : null);

  const outfitsCreated: { itemIds: string[]; reasoning: string }[] = [];

  for (let idx = 1; idx <= 3; idx++) {
    const selectedIds: string[] = [];
    const selectedItems: { color: string; category: string }[] = [];

    const top = getRand(tops) || getRand(items);
    const bottom = getRand(bottoms) || getRand(items);
    const shoe = getRand(shoes) || getRand(items);
    const outer = idx % 2 === 0 ? getRand(outerwear) : null;

    if (top) { selectedIds.push(top.id); selectedItems.push({ color: top.color, category: 'Tops' }); }
    if (bottom) { selectedIds.push(bottom.id); selectedItems.push({ color: bottom.color, category: 'Bottoms' }); }
    if (shoe) { selectedIds.push(shoe.id); selectedItems.push({ color: shoe.color, category: 'Shoes' }); }
    if (outer) { selectedIds.push(outer.id); selectedItems.push({ color: outer.color, category: 'Outerwear' }); }

    if (selectedIds.length === 0) continue;

    const reasoning = await generateOutfitReasoning(selectedItems, weather, calendarEvent);

    outfitsCreated.push({
      itemIds: selectedIds,
      reasoning,
    });
  }

  // Save creations to Prisma
  for (const o of outfitsCreated) {
    await prisma.outfit.create({
      data: {
        userId,
        date: dateStr,
        itemIds: o.itemIds,
        reasoning: o.reasoning,
        status: 'pending',
      },
    });
  }
}
