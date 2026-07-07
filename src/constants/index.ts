export const CATEGORIES = ['Outerwear', 'Tops', 'Bottoms', 'Shoes', 'Accessories'] as const;
export const SEASONS = ['Spring', 'Summer', 'Autumn', 'Winter'] as const;
export const FORMALITIES = ['Formal', 'Smart Casual', 'Casual'] as const;

export type CategoryType = typeof CATEGORIES[number];
export type SeasonType = typeof SEASONS[number];
export type FormalityType = typeof FORMALITIES[number];

export const TRAIT_LABELS: Record<string, [string, string]> = {
  'relaxed-structured': ['Relaxed', 'Structured'],
  'neutral-bold': ['Neutral', 'Bold'],
  'minimal-maximal': ['Minimal', 'Maximal'],
  'heritage-modern': ['Heritage', 'Modern'],
};

export const DEFAULT_TRAITS = {
  'relaxed-structured': 0.5,
  'neutral-bold': 0.5,
  'minimal-maximal': 0.5,
  'heritage-modern': 0.5,
};
