'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadGarmentPhoto } from '@/lib/cloudinary';
import { tagGarmentImage } from '@/lib/gemini';
import { revalidatePath } from 'next/cache';

/**
 * Uploads a garment photo, triggers Gemini AI auto-tagging, and inserts it into the user's closet.
 */
export async function addClosetItem(base64Image: string, mimeType: string, fileName: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const userId = session.user.id;

  try {
    // 1. Upload to Cloudinary & generate original and thumbnail URLs
    const media = await uploadGarmentPhoto(base64Image, fileName);

    // 2. Pass base64 image data to Gemini Vision for auto-classification
    const tags = await tagGarmentImage(base64Image, mimeType);

    // 3. Save ClosetItem to PostgreSQL database via Prisma
    const newItem = await prisma.closetItem.create({
      data: {
        userId,
        photoUrl: media.originalUrl,
        thumbnailUrl: media.thumbnailUrl,
        category: tags.category,
        color: tags.color,
        season: tags.season,
        formality: tags.formality,
      },
    });

    // 4. Trigger Style DNA recalculation asynchronously
    await recalculateStyleDNA(userId);

    revalidatePath('/dashboard');
    return { success: true, item: newItem };
  } catch (error: any) {
    console.error('addClosetItem error:', error);
    return { success: false, error: error.message || 'Failed to catalogue item' };
  }
}

/**
 * Manually updates garment tags and triggers Style DNA update.
 */
export async function updateClosetItem(id: string, data: {
  category: string;
  color: string;
  season: string;
  formality: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const userId = session.user.id;

  try {
    const updated = await prisma.closetItem.update({
      where: { id, userId },
      data,
    });

    await recalculateStyleDNA(userId);

    revalidatePath('/dashboard');
    return { success: true, item: updated };
  } catch (error: any) {
    console.error('updateClosetItem error:', error);
    return { success: false, error: error.message || 'Failed to update tags' };
  }
}

/**
 * Deletes a garment from the database.
 */
export async function deleteClosetItem(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const userId = session.user.id;

  try {
    await prisma.closetItem.delete({
      where: { id, userId },
    });

    await recalculateStyleDNA(userId);

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('deleteClosetItem error:', error);
    return { success: false, error: error.message || 'Failed to delete garment' };
  }
}

/**
 * Helper to recalculate user's Style DNA profile traits and top colors.
 */
async function recalculateStyleDNA(userId: string) {
  try {
    const items = await prisma.closetItem.findMany({ where: { userId } });
    if (items.length === 0) return;

    // Calculate top 5 dominant colors
    const colorCounts: Record<string, number> = {};
    items.forEach(i => {
      colorCounts[i.color] = (colorCounts[i.color] || 0) + 1;
    });
    const topColors = Object.entries(colorCounts)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0])
      .slice(0, 5);

    // Calculate category ratios for archetype tags
    const casualCount = items.filter(i => i.formality === 'Casual').length;
    const formalCount = items.filter(i => i.formality === 'Formal').length;
    const smartCasualCount = items.filter(i => i.formality === 'Smart Casual').length;
    const total = items.length;

    const relaxedStructured = (casualCount * 0.1 + smartCasualCount * 0.5 + formalCount * 0.9) / total;

    await prisma.styleProfile.upsert({
      where: { userId },
      update: {
        topColors,
        traits: {
          'relaxed-structured': relaxedStructured,
          'neutral-bold': 0.5,
          'minimal-maximal': total > 15 ? 0.8 : 0.4,
          'heritage-modern': 0.5,
        },
        lastComputedAt: new Date(),
      },
      create: {
        userId,
        topColors,
        traits: {
          'relaxed-structured': relaxedStructured,
          'neutral-bold': 0.5,
          'minimal-maximal': total > 15 ? 0.8 : 0.4,
          'heritage-modern': 0.5,
        },
      },
    });
  } catch (err) {
    console.error('recalculateStyleDNA error:', err);
  }
}
