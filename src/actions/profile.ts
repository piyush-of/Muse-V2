'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function getStyleProfileData() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const userId = session.user.id;

  try {
    // 1. Fetch style profile
    let profile = await prisma.styleProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      profile = await prisma.styleProfile.create({
        data: {
          userId,
          traits: {
            'relaxed-structured': 0.5,
            'neutral-bold': 0.5,
            'minimal-maximal': 0.5,
            'heritage-modern': 0.5,
          },
          topColors: [],
        },
      });
    }

    // 2. Compute dynamic metrics (Acceptance Rate)
    const outfits = await prisma.outfit.findMany({
      where: {
        userId,
        status: { in: ['accepted', 'rejected'] },
      },
    });

    const acceptedCount = outfits.filter(o => o.status === 'accepted').length;
    const totalDecisions = outfits.length;
    const acceptanceRate = totalDecisions > 0 ? Math.round((acceptedCount / totalDecisions) * 100) : 85;

    // 3. Find rediscovery callout (lowest wear counts)
    const items = await prisma.closetItem.findMany({
      where: { userId },
      orderBy: [
        { wearEvents: { _count: 'asc' } },
        { createdAt: 'asc' },
      ],
      take: 1,
    });

    const rediscoveryItem = items[0] || null;

    return {
      success: true,
      profile: {
        traits: profile.traits as Record<string, number>,
        topColors: profile.topColors,
        lastComputedAt: profile.lastComputedAt.toISOString(),
        metrics: {
          acceptanceRate,
          totalDecisions,
          closetCount: await prisma.closetItem.count({ where: { userId } }),
          wearEventsCount: await prisma.wearEvent.count({ where: { userId } }),
        },
        rediscoveryItem,
      },
    };
  } catch (error: any) {
    console.error('getStyleProfileData error:', error);
    return { success: false, error: error.message || 'Failed to fetch style DNA' };
  }
}
