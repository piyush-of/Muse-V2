'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateOutfitReasoning } from '@/lib/gemini';
import { getWeatherSummary } from '@/lib/weather';
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
    const existing = await prisma.outfit.findFirst({
      where: { id: outfitId, userId },
    });

    if (!existing) {
      throw new Error('Outfit suggestion not found');
    }

    const updated = await prisma.outfit.update({
      where: { id: outfitId },
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
 * Force-recompiles today's capsule from scratch — used when the person updates
 * today's calendar note and wants suggestions that reflect it immediately.
 */
export async function regenerateTodayCapsule() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const userId = session.user.id;
  const todayDate = new Date().toISOString().split('T')[0];

  try {
    await prisma.outfit.deleteMany({ where: { userId, date: todayDate } });
    await compileUserDailyCapsule(userId, todayDate);
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('regenerateTodayCapsule error:', error);
    return { success: false, error: error.message || 'Failed to regenerate capsule' };
  }
}

/**
 * Weighted random pick — higher weight means more likely, but never guaranteed,
 * which keeps the 3 suggestions varied instead of always picking the single
 * "best" item in every slot.
 */
function weightedPick<T>(candidates: { item: T; weight: number }[]): T | null {
  const pool = candidates.filter(c => c.weight > 0);
  if (pool.length === 0) return candidates[0]?.item ?? null;

  const total = pool.reduce((sum, c) => sum + c.weight, 0);
  let roll = Math.random() * total;
  for (const c of pool) {
    roll -= c.weight;
    if (roll <= 0) return c.item;
  }
  return pool[pool.length - 1].item;
}

const FORMALITY_SCORE: Record<string, number> = { Casual: 0.1, 'Smart Casual': 0.5, Formal: 0.9 };

/**
 * Core compiler: generates up to 3 distinct outfit combinations, weighted by
 * how long it's been since an item was worn (surfacing neglected pieces) and
 * how well its formality matches the person's Style DNA — instead of a flat
 * random pick. Weather and the day's calendar note come from real sources,
 * not hardcoded strings.
 */
async function compileUserDailyCapsule(userId: string, dateStr: string) {
  const [items, user, styleProfile, dailyContext, recentWear] = await Promise.all([
    prisma.closetItem.findMany({ where: { userId } }),
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.styleProfile.findUnique({ where: { userId } }),
    prisma.dailyContext.findUnique({ where: { userId_date: { userId, date: dateStr } } }),
    prisma.wearEvent.findMany({
      where: { userId },
      orderBy: { wornAt: 'desc' },
      distinct: ['closetItemId'],
    }),
  ]);

  if (items.length === 0) return;

  const weather = await getWeatherSummary(user?.latitude, user?.longitude);
  const calendarEvent = dailyContext?.calendarEvent?.trim() || 'No calendar event set for today';
  const relaxedStructured = (styleProfile?.traits as Record<string, number> | undefined)?.['relaxed-structured'] ?? 0.5;

  const lastWornMap = new Map(recentWear.map(w => [w.closetItemId, w.wornAt.getTime()]));
  const now = Date.now();
  const DAY_MS = 1000 * 60 * 60 * 24;

  // Higher weight = hasn't been worn in a while (or never), and formality
  // aligns with the user's relaxed<->structured Style DNA position.
  const scoreItem = (item: (typeof items)[number]) => {
    const lastWorn = lastWornMap.get(item.id);
    const daysSinceWorn = lastWorn ? (now - lastWorn) / DAY_MS : 45; // treat "never worn" like 45 days neglected
    const recencyWeight = Math.min(daysSinceWorn, 60) / 60; // 0..1, caps out at 60 days
    const formalityWeight = 1 - Math.abs((FORMALITY_SCORE[item.formality] ?? 0.5) - relaxedStructured);
    const rainPenalty = weather.willRain && item.category === 'Shoes' && item.formality === 'Formal' ? 0.5 : 1;
    return Math.max(0.05, recencyWeight * 0.6 + formalityWeight * 0.4) * rainPenalty;
  };

  const outerwear = items.filter(i => i.category === 'Outerwear');
  const tops = items.filter(i => i.category === 'Tops');
  const bottoms = items.filter(i => i.category === 'Bottoms');
  const shoes = items.filter(i => i.category === 'Shoes');

  const pickWeighted = (pool: typeof items, exclude: Set<string>) => {
    const eligible = pool.filter(i => !exclude.has(i.id));
    const source = eligible.length > 0 ? eligible : pool;
    if (source.length === 0) return null;
    return weightedPick(source.map(item => ({ item, weight: scoreItem(item) })));
  };

  const outfitsCreated: { itemIds: string[]; reasoning: string }[] = [];
  const usedTopIds = new Set<string>();
  const usedBottomIds = new Set<string>();

  // Cold or rainy weather earns an outerwear layer more often.
  const wantsOuterwear = (weather.temperatureC !== null && weather.temperatureC < 18) || weather.willRain;

  for (let idx = 0; idx < 3; idx++) {
    const selectedIds: string[] = [];
    const selectedItems: { color: string; category: string }[] = [];

    const top = pickWeighted(tops.length > 0 ? tops : items, usedTopIds);
    const bottom = pickWeighted(bottoms.length > 0 ? bottoms : items, usedBottomIds);
    const shoe = pickWeighted(shoes.length > 0 ? shoes : items, new Set());
    const includeOuter = outerwear.length > 0 && (wantsOuterwear || idx % 2 === 0);
    const outer = includeOuter ? pickWeighted(outerwear, new Set()) : null;

    if (top) { selectedIds.push(top.id); selectedItems.push({ color: top.color, category: 'Tops' }); usedTopIds.add(top.id); }
    if (bottom) { selectedIds.push(bottom.id); selectedItems.push({ color: bottom.color, category: 'Bottoms' }); usedBottomIds.add(bottom.id); }
    if (shoe) { selectedIds.push(shoe.id); selectedItems.push({ color: shoe.color, category: 'Shoes' }); }
    if (outer) { selectedIds.push(outer.id); selectedItems.push({ color: outer.color, category: 'Outerwear' }); }

    if (selectedIds.length === 0) continue;

    const reasoning = await generateOutfitReasoning(selectedItems, weather.summary, calendarEvent);

    outfitsCreated.push({ itemIds: selectedIds, reasoning });
  }

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
