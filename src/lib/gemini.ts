import { GoogleGenAI } from '@google/genai';

if (!process.env.GEMINI_API_KEY) {
  console.warn("⚠️ Warning: GEMINI_API_KEY is missing from environment variables.");
}

// Initialize the verified unified SDK client
export const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

function parseGeminiJson<T>(raw: string): T | null {
  const cleaned = raw.trim().replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');

  if (start !== -1 && end !== -1 && end > start) {
    try {
      return JSON.parse(cleaned.slice(start, end + 1)) as T;
    } catch {
      // Fall through to plain-text handling
    }
  }

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    return null;
  }
}

export async function askGemini(prompt: string) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Execution Error:", error);
    throw new Error("AI Layer failure");
  }
}

export async function generateOutfitReasoning(
  selectedItems: { color: string; category: string }[],
  weather: string,
  calendarEvent: string
) {
  const prompt = `You are a wardrobe stylist. Based on the selected outfit items, generate a concise, human-friendly rationale explaining why the combination works for the given context. Return ONLY a JSON object shaped as {"reasoning": "..."}.\n\nSelected items: ${JSON.stringify(selectedItems)}\nWeather: ${weather}\nCalendar event: ${calendarEvent}`;

  const raw = await askGemini(prompt);
  const parsed = parseGeminiJson<{ reasoning?: string }>(raw || '{}');

  if (parsed?.reasoning) {
    return parsed.reasoning;
  }

  return typeof raw === 'string' ? raw : 'This outfit blends the available wardrobe pieces well for the planned day.';
}

/**
 * Strips a data: URL prefix (e.g. "data:image/png;base64,") if present,
 * since the Gemini API expects raw base64 payload only.
 */
function stripDataUrlPrefix(base64Image: string): string {
  const commaIndex = base64Image.indexOf(',');
  if (base64Image.startsWith('data:') && commaIndex !== -1) {
    return base64Image.slice(commaIndex + 1);
  }
  return base64Image;
}

export async function tagGarmentImage(base64Image: string, mimeType: string) {
  const prompt = `You are a fashion image tagger. Look at the supplied garment photo and return ONLY a JSON object with shape {"category": "Tops|Bottoms|Outerwear|Shoes|Accessories", "color": "a hex color code for the dominant fabric color", "season": "Spring|Summer|Autumn|Winter|All Season", "formality": "Casual|Smart Casual|Formal"}. Base your answer on what is actually visible in the image.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType,
                data: stripDataUrlPrefix(base64Image),
              },
            },
            { text: prompt },
          ],
        },
      ],
    });

    const raw = response.text;
    const parsed = parseGeminiJson<{
      category?: string;
      color?: string;
      season?: string;
      formality?: string;
    }>(raw || '{}');

    return {
      category: parsed?.category || 'Tops',
      color: parsed?.color || '#808080',
      season: parsed?.season || 'All Season',
      formality: parsed?.formality || 'Casual',
    };
  } catch (error) {
    console.error('tagGarmentImage error:', error);
    return {
      category: 'Tops',
      color: '#808080',
      season: 'All Season',
      formality: 'Casual',
    };
  }
}