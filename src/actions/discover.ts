'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function getWardrobeGaps() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const userId = session.user.id;

  try {
    const items = await prisma.closetItem.findMany({ where: { userId } });
    const gaps = [];

    // Fallback stubs for empty wardrobe
    if (items.length === 0) {
      return {
        success: true,
        gaps: [
          {
            id: 'onboarding-gap',
            title: "Wardrobe Digitalization Pending",
            type: "Onboarding Gap",
            description: "Upload your first few garments. MUSE requires catalogued items to analyze styling combinations.",
            impact: "Unlocks outfit compilations",
            recommendations: [
              { name: "Camera Upload", brand: "MUSE Auto-Tag", price: "Free", material: "Your closet items", color: "#4B3B66", combos: "Upload photos to start" }
            ]
          }
        ]
      };
    }

    const categories = items.map(i => i.category);
    const colors = items.map(i => i.color);
    const formalCount = items.filter(i => i.formality === 'Formal').length;

    // Composition Check: Outerwear
    if (!categories.includes('Outerwear')) {
      gaps.push({
        id: 'outerwear-gap',
        title: "Outerwear Shell Gap",
        type: "Composition Gap",
        description: "You have digitized tops and bottoms, but lack seasonal outerwear layers. A structured overcoat or trench blazer will complete outfits for cold conditions.",
        impact: "+14 combinations unlocked",
        recommendations: [
          { name: "Double-Face Cashmere Cardigan", brand: "The Row", price: "$690", material: "100% Cashmere", color: "#E5E2DD", combos: "Styles with all existing tops" },
          { name: "Technical Trench Shell", brand: "Mackintosh", price: "$450", material: "Gore-Tex Canvas", color: "#211F1B", combos: "Rain-optimized layering" }
        ]
      });
    }

    // Color DNA Balance Check
    const uniqueColors = new Set(colors);
    if (uniqueColors.size <= 2 && items.length >= 3) {
      gaps.push({
        id: 'color-gap',
        title: "Monochrome Saturation Alert",
        type: "Color DNA Balance",
        description: "Over 80% of your wardrobe is concentrated in a single color tone. Introducing a neutral linen or sand-colored knit will double outfit combinations without feeling loud.",
        impact: "Doubles styling options",
        recommendations: [
          { name: "Raw Silk Sand Collar Shirt", brand: "Jacquemus", price: "$320", material: "100% Raw Silk", color: "#F5F2EC", combos: "Neutralizes dark bottoms" }
        ]
      });
    }

    // Formality Check
    if (formalCount === 0 && items.length >= 4) {
      gaps.push({
        id: 'formality-gap',
        title: "Occasion Alignment Gap",
        type: "Formality Balance",
        description: "Your wardrobe consists entirely of casual garments. Incorporating a structured smart-casual layer (like a tailored trouser or blazer) bridges the gap for business calendar events.",
        impact: "Expands occasion capability",
        recommendations: [
          { name: "Pleated Slate Trousers", brand: "PT Torino", price: "$280", material: "Wool Flannel", color: "#6B6459", combos: "Unlocks client pitch layouts" }
        ]
      });
    }

    // Default general check
    if (gaps.length === 0) {
      gaps.push({
        id: 'general-improvement',
        title: "Optimal Closet Balance",
        type: "Wardrobe Health",
        description: "Your closet has balanced categories and colors. To optimize styling paths further, adding a premium low-profile leather sneaker would bridge daily active comfort tasks.",
        impact: "+6 styling paths",
        recommendations: [
          { name: "Achilles Low in Warm Grey", brand: "Common Projects", price: "$415", material: "Nappa Leather", color: "#A39C8E", combos: "Combines with all denim and wool pants" }
        ]
      });
    }

    return { success: true, gaps };
  } catch (error: any) {
    console.error('getWardrobeGaps error:', error);
    return { success: false, error: error.message || 'Failed to analyze closet gaps' };
  }
}
