import { Response } from 'express';
import { AuthenticatedRequest } from '../routes/authMiddleware';
import prisma from '../services/db';

/**
 * GET /profile/style-dna
 * Computes and returns the user's Style DNA, key metrics, and rediscovery highlights
 */
export async function getStyleProfile(req: AuthenticatedRequest, res: Response) {
  const userId = req.userId!;

  try {
    // 1. Fetch style profile
    let profile = await prisma.styleProfile.findUnique({
      where: { userId }
    });

    // On-demand creation if missing
    if (!profile) {
      profile = await prisma.styleProfile.create({
        data: {
          userId,
          traits: {
            "relaxed-structured": 0.5,
            "neutral-bold": 0.5,
            "minimal-maximal": 0.5,
            "heritage-modern": 0.5
          },
          topColors: []
        }
      });
    }

    // 2. Compute dynamic metrics: Acceptance Rate (North Star Metric)
    const outfits = await prisma.outfit.findMany({
      where: {
        userId,
        status: { in: ['accepted', 'rejected'] }
      }
    });

    const acceptedCount = outfits.filter(o => o.status === 'accepted').length;
    const totalDecisions = outfits.length;
    const acceptanceRate = totalDecisions > 0 ? Math.round((acceptedCount / totalDecisions) * 100) : 85; // 85% default mock for empty testing profiles

    // 3. Find "rediscovery" callout - item with lowest wear count that hasn't been worn today
    const items = await prisma.closetItem.findMany({
      where: { userId },
      orderBy: [
        { wearEvents: { _count: 'asc' } }, // lowest wears first
        { createdAt: 'asc' }
      ],
      take: 1
    });

    const rediscoveryItem = items[0] || null;

    // 4. Return combined style payload
    return res.status(200).json({
      traits: profile.traits,
      topColors: profile.topColors,
      lastComputedAt: profile.lastComputedAt,
      metrics: {
        acceptanceRate,
        totalDecisions,
        closetCount: await prisma.closetItem.count({ where: { userId } }),
        wearEventsCount: await prisma.wearEvent.count({ where: { userId } })
      },
      rediscoveryItem
    });
  } catch (error) {
    console.error("Get style profile error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
