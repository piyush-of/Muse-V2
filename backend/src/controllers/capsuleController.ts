import { Response } from 'express';
import { AuthenticatedRequest } from '../routes/authMiddleware';
import prisma from '../services/db';
import { compileUserDailyCapsule } from '../services/cron';

/**
 * GET /capsule/today
 * Returns today's cached 3 outfits. Compiles them on-demand if missing.
 */
export async function getTodayCapsule(req: AuthenticatedRequest, res: Response) {
  const userId = req.userId!;
  const todayStr = new Date().toISOString().split('T')[0];

  try {
    // 1. Fetch today's outfits for this user
    let outfits = await prisma.outfit.findMany({
      where: {
        userId,
        date: todayStr
      }
    });

    // 2. If no outfits cached (e.g. new user registered today), compile them on-demand
    if (outfits.length === 0) {
      await compileUserDailyCapsule(userId, todayStr);
      outfits = await prisma.outfit.findMany({
        where: {
          userId,
          date: todayStr
        }
      });
    }

    // 3. For each outfit, fetch the full garment metadata from ClosetItem
    // This allows the frontend to render names, colors, brands, and photos easily.
    const populatedOutfits = await Promise.all(
      outfits.map(async (outfit) => {
        const garments = await prisma.closetItem.findMany({
          where: {
            id: { in: outfit.itemIds }
          }
        });
        return {
          ...outfit,
          garments
        };
      })
    );

    return res.status(200).json(populatedOutfits);
  } catch (error) {
    console.error("Get today's capsule error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * POST /capsule/:id/accept
 * Accepts the outfit look and registers WearEvents for its items
 */
export async function acceptOutfit(req: AuthenticatedRequest, res: Response) {
  const userId = req.userId!;
  const outfitId = parseInt(req.params.id);

  if (isNaN(outfitId)) {
    return res.status(400).json({ error: "Invalid outfit ID" });
  }

  try {
    const outfit = await prisma.outfit.findFirst({
      where: { id: outfitId, userId }
    });

    if (!outfit) {
      return res.status(404).json({ error: "Outfit suggestion not found" });
    }

    // Update outfit status and log WearEvents within a transaction
    await prisma.$transaction(async (tx) => {
      // Set outfit state
      await tx.outfit.update({
        where: { id: outfitId },
        data: { status: 'accepted' }
      });

      // Clear any other accepted outfits for today (only 1 look accepted per day)
      await tx.outfit.updateMany({
        where: {
          userId,
          date: outfit.date,
          id: { not: outfitId },
          status: 'accepted'
        },
        data: { status: 'pending' }
      });

      // Register WearEvents for all items in the accepted outfit
      const eventsData = outfit.itemIds.map(itemId => ({
        userId,
        closetItemId: itemId,
        outfitId: outfitId,
        wornAt: new Date()
      }));

      await tx.wearEvent.createMany({
        data: eventsData
      });
    });

    return res.status(200).json({ message: "Outfit accepted and wear events logged successfully" });
  } catch (error) {
    console.error("Accept outfit error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * POST /capsule/:id/reject
 * Rejects the outfit look and logs the rejection reasons
 */
export async function rejectOutfit(req: AuthenticatedRequest, res: Response) {
  const userId = req.userId!;
  const outfitId = parseInt(req.params.id);
  const { reason } = req.body;

  if (isNaN(outfitId)) {
    return res.status(400).json({ error: "Invalid outfit ID" });
  }

  try {
    const outfit = await prisma.outfit.findFirst({
      where: { id: outfitId, userId }
    });

    if (!outfit) {
      return res.status(404).json({ error: "Outfit suggestion not found" });
    }

    // Set outfit state and write reason
    const updatedOutfit = await prisma.outfit.update({
      where: { id: outfitId },
      data: {
        status: 'rejected',
        rejectionReason: reason || "No reason specified"
      }
    });

    return res.status(200).json({
      message: "Outfit rejection logged successfully",
      outfit: updatedOutfit
    });
  } catch (error) {
    console.error("Reject outfit error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
