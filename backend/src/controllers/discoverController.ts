import { Response } from 'express';
import { AuthenticatedRequest } from '../routes/authMiddleware';
import prisma from '../services/db';

interface GapInsight {
  id: number;
  title: string;
  type: string;
  description: string;
  impact: string;
  recommendations: {
    name: string;
    brand: string;
    price: string;
    material: string;
    color: string;
    combos: string;
  }[];
}

/**
 * GET /discover/gaps
 * Audits the user's wardrobe and returns structural gaps
 */
export async function getGaps(req: AuthenticatedRequest, res: Response) {
  const userId = req.userId!;

  try {
    const items = await prisma.closetItem.findMany({ where: { userId } });
    const gaps: GapInsight[] = [];

    // Fallback stub gaps for empty wardrobes
    if (items.length === 0) {
      return res.status(200).json([
        {
          id: 1,
          title: "Wardrobe Digitalization Pending",
          type: "Onboarding Gap",
          description: "Upload your first few garments. MUSE requires catalogued items to analyze styling combinations.",
          impact: "Unlocks outfit compilations",
          recommendations: [
            { name: "Camera Upload", brand: "MUSE Auto-Tag", price: "Free", material: "Your closet items", color: "#4B3B66", combos: "Upload photos to start" }
          ]
        }
      ]);
    }

    const categories = items.map(i => i.category);
    const formalCount = items.filter(i => i.formality === 'Formal').length;
    const colors = items.map(i => i.color);

    // Gap 1: No Outerwear
    if (!categories.includes('Outerwear')) {
      gaps.push({
        id: 1,
        title: "Outerwear Shell Gap",
        type: "Composition Gap",
        description: "You have digitized tops and bottoms, but lack seasonal outerwear layers. A clean overcoat or blazer will complete look structures for cool weather.",
        impact: "+14 combinations unlocked",
        recommendations: [
          { name: "Double-Face Cashmere Cardigan", brand: "The Row", price: "$690", material: "100% Cashmere", color: "#E5E2DD", combos: "Styles with all existing tops" },
          { name: "Technical Trench Shell", brand: "Mackintosh", price: "$450", material: "Gore-Tex Cotton Canvas", color: "#211F1B", combos: "Rain-optimized layering" }
        ]
      });
    }

    // Gap 2: High Monochrome Saturation
    const uniqueColors = new Set(colors);
    if (uniqueColors.size <= 2 && items.length >= 3) {
      gaps.push({
        id: 2,
        title: "Monochrome Saturation Alert",
        type: "Color DNA Balance",
        description: "Over 80% of your wardrobe is concentrated in a single color tone. Introducing a neutral linen or sand-colored knit will double outfit combinations without feeling loud.",
        impact: "Doubles styling options",
        recommendations: [
          { name: "Raw Silk Sand Collar Shirt", brand: "Jacquemus", price: "$320", material: "100% Raw Silk", color: "#F5F2EC", combos: "Neutralizes dark bottoms" }
        ]
      });
    }

    // Gap 3: Occasion Alignment (lack of formal layers)
    if (formalCount === 0 && items.length >= 4) {
      gaps.push({
        id: 3,
        title: "Occasion Alignment Gap",
        type: "Formality Balance",
        description: "Your wardrobe consists entirely of casual garments. Incorporating a structured smart-casual layer (like a tailored trouser or blazer) bridges the gap for business calendar events.",
        impact: "Expands occasion capability",
        recommendations: [
          { name: "Pleated Slate Trousers", brand: "PT Torino", price: "$280", material: "Wool Flannel", color: "#6B6459", combos: "Unlocks client pitch layouts" }
        ]
      });
    }

    // Default general suggestions if no specific gaps are met
    if (gaps.length === 0) {
      gaps.push({
        id: 4,
        title: "Optimal Closet Balance",
        type: "Wardrobe Health",
        description: "Your closet has balanced categories and colors. To optimize further, adding a premium low-profile leather sneaker would bridge daily active comfort tasks.",
        impact: "+6 styling paths",
        recommendations: [
          { name: "Achilles Low in Warm Grey", brand: "Common Projects", price: "$415", material: "Nappa Leather", color: "#A39C8E", combos: "Combines with all denim and wool pants" }
        ]
      });
    }

    return res.status(200).json(gaps);
  } catch (error) {
    console.error("Fetch discover gaps error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
