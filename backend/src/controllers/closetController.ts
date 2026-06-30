import { Response } from 'express';
import { AuthenticatedRequest } from '../routes/authMiddleware';
import prisma from '../services/db';
import { storeGarmentPhoto } from '../services/storage';
import { tagGarmentImage } from '../services/ai';

/**
 * GET /closet
 * Lists all closet items belonging to the user
 */
export async function getCloset(req: AuthenticatedRequest, res: Response) {
  const userId = req.userId!;

  try {
    const items = await prisma.closetItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    return res.status(200).json(items);
  } catch (error) {
    console.error("Fetch closet error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * POST /closet
 * Uploads a photo, triggers Claude AI tagging, and inserts the garment
 */
export async function addClosetItem(req: AuthenticatedRequest, res: Response) {
  const userId = req.userId!;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: "Garment photo upload is required" });
  }

  try {
    // 1. Write the file to disk / S3 and generate thumbnail
    const uploadResult = await storeGarmentPhoto(file.buffer, file.originalname, file.mimetype);

    // 2. Convert buffer to base64 and execute Anthropic auto-tagging
    const base64Str = file.buffer.toString('base64');
    const tags = await tagGarmentImage(base64Str, file.mimetype);

    // 3. Create the database record. 
    // We save the thumbnailUrl as photoUrl to respect the UX rule of serving thumbnails in grid lists.
    const newItem = await prisma.closetItem.create({
      data: {
        userId,
        photoUrl: uploadResult.thumbnailUrl, // serve thumbnail for grid views
        category: tags.category,
        color: tags.color,
        season: tags.season,
        formality: tags.formality
      }
    });

    // 4. Update the User's Style DNA profile asynchronously
    updateStyleDNAAfterUpload(userId);

    return res.status(201).json({
      message: "Garment catalogued successfully",
      item: newItem,
      originalUrl: uploadResult.originalUrl
    });
  } catch (error) {
    console.error("Upload closet item error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * PATCH /closet/:id
 * Manually updates garment tags
 */
export async function updateClosetItem(req: AuthenticatedRequest, res: Response) {
  const userId = req.userId!;
  const itemId = parseInt(req.params.id);
  const { category, color, season, formality } = req.body;

  if (isNaN(itemId)) {
    return res.status(400).json({ error: "Invalid garment ID" });
  }

  try {
    const item = await prisma.closetItem.findFirst({
      where: { id: itemId, userId }
    });

    if (!item) {
      return res.status(404).json({ error: "Garment not found" });
    }

    const updatedItem = await prisma.closetItem.update({
      where: { id: itemId },
      data: {
        category: category !== undefined ? category : item.category,
        color: color !== undefined ? color : item.color,
        season: season !== undefined ? season : item.season,
        formality: formality !== undefined ? formality : item.formality
      }
    });

    // Recalculate Style DNA traits
    updateStyleDNAAfterUpload(userId);

    return res.status(200).json(updatedItem);
  } catch (error) {
    console.error("Update closet item error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Helper to update Style DNA after wardrobe uploads/updates
 */
async function updateStyleDNAAfterUpload(userId: number) {
  try {
    const items = await prisma.closetItem.findMany({ where: { userId } });
    if (items.length === 0) return;

    // Calculate dominant color distribution ratios
    const colorCounts: Record<string, number> = {};
    items.forEach(i => {
      colorCounts[i.color] = (colorCounts[i.color] || 0) + 1;
    });

    const topColors = Object.entries(colorCounts)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0])
      .slice(0, 5); // top 5 colors

    // Calculate archetype trait ratios
    const formalCount = items.filter(i => i.formality === 'Formal').length;
    const casualCount = items.filter(i => i.formality === 'Casual').length;
    const smartCasualCount = items.filter(i => i.formality === 'Smart Casual').length;
    const totalCount = items.length;

    // Map ratios between 0.0 and 1.0
    const relaxedStructured = (casualCount * 0.1 + smartCasualCount * 0.5 + formalCount * 0.9) / totalCount;

    await prisma.styleProfile.upsert({
      where: { userId },
      update: {
        topColorsString: JSON.stringify(topColors),
        traitsString: JSON.stringify({
          "relaxed-structured": relaxedStructured,
          "neutral-bold": 0.5,
          "minimal-maximal": totalCount > 15 ? 0.8 : 0.4,
          "heritage-modern": 0.5
        }),
        lastComputedAt: new Date()
      },
      create: {
        userId,
        topColorsString: JSON.stringify(topColors),
        traitsString: JSON.stringify({
          "relaxed-structured": relaxedStructured,
          "neutral-bold": 0.5,
          "minimal-maximal": totalCount > 15 ? 0.8 : 0.4,
          "heritage-modern": 0.5
        })
      }
    });
  } catch (err) {
    console.error("Asynchronous Style DNA update failed:", err);
  }
}
