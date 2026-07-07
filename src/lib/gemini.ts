import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;

// Initialize Google Gemini client if API key is provided
export const gemini = apiKey ? new GoogleGenAI({ apiKey }) : null;

export interface TagResult {
  category: string;
  color: string;
  season: string;
  formality: string;
}

/**
 * Uses Gemini Vision model to analyze an image buffer and extract garment properties.
 */
export async function tagGarmentImage(base64Image: string, mimeType: string): Promise<TagResult> {
  if (!gemini) {
    console.warn("GEMINI_API_KEY is not set. Executing fallback mock tagger.");
    return mockTagHeuristics();
  }

  try {
    const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, '');

    const response = await gemini.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          inlineData: {
            mimeType: mimeType,
            data: cleanBase64,
          },
        },
        `Analyze this clothing item image. Extract its style properties and return a JSON object with exactly these keys:
- category: must be one of "Outerwear", "Tops", "Bottoms", "Shoes", "Accessories"
- color: a dominant hex code (e.g. "#4B3B66") representing the primary shade of the fabric
- season: must be one of "Spring", "Summer", "Autumn", "Winter"
- formality: must be one of "Formal", "Smart Casual", "Casual"

Only output raw JSON. Do not write markdown blocks or conversational text.`,
      ],
    });

    const text = response.text || '';
    // Strip markdown code block wrappers if any
    const cleanText = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleanText);

    return {
      category: parsed.category || 'Tops',
      color: parsed.color || '#A39C8E',
      season: parsed.season || 'Autumn',
      formality: parsed.formality || 'Smart Casual',
    };
  } catch (error) {
    console.error("Gemini tagging failed, using mock fallback:", error);
    return mockTagHeuristics();
  }
}

/**
 * Uses Gemini to generate dynamic outfit styling suggestions and reasoning.
 */
export async function generateOutfitReasoning(
  items: { color: string; category: string }[],
  weather: string,
  calendarEvent: string
): Promise<string> {
  if (!gemini) {
    return `Picked for ${weather} conditions – layering color ${items[0]?.color || ''} tones to match your day.`;
  }

  try {
    const itemsDescription = items.map(i => `${i.color} ${i.category.toLowerCase()}`).join(', ');
    const response = await gemini.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are the styling brain for MUSE, a premium fashion app. Write a single, brief plain-language reasoning sentence (maximum 20 words) explaining why this outfit is combined for the user.
Context:
- Outfit Items: ${itemsDescription}
- Today's Weather: ${weather}
- Calendar: ${calendarEvent}

Guidelines:
- Explain why the layers match the weather/calendar context.
- Be editorial, direct, and helpful (e.g. "picked for the rain later — knit layers under a coat").
- Do not write markdown tags.`,
    });

    return (response.text || '').trim().replace(/^"|"$/g, '');
  } catch (error) {
    console.error("Gemini reasoning failed, using fallback:", error);
    return `Coordinated for ${weather} conditions and tailored for your ${calendarEvent}.`;
  }
}

// Fallback high-fidelity mocks
const MOCK_ITEMS = [
  { category: "Outerwear", color: "#4B3B66", season: "Winter", formality: "Formal" },
  { category: "Tops", color: "#F5F2EC", season: "Autumn", formality: "Smart Casual" },
  { category: "Bottoms", color: "#211F1B", season: "Spring", formality: "Casual" },
  { category: "Shoes", color: "#6B6459", season: "Winter", formality: "Smart Casual" }
];

function mockTagHeuristics(): TagResult {
  const rand = MOCK_ITEMS[Math.floor(Math.random() * MOCK_ITEMS.length)];
  return {
    category: rand.category,
    color: rand.color,
    season: rand.season,
    formality: rand.formality
  };
}
