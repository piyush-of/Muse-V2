/**
 * Live weather lookup via Open-Meteo (https://open-meteo.com) — no API key required.
 * Replaces the previously hardcoded weather string in the capsule compiler.
 */

// Fallback coordinates used until a user has granted location or set one manually.
// Override via env if you want a different default for your userbase.
const DEFAULT_LAT = parseFloat(process.env.DEFAULT_LAT || '26.9124'); // Jaipur, India
const DEFAULT_LON = parseFloat(process.env.DEFAULT_LON || '75.7873');

// WMO weather codes -> plain-language description
// https://open-meteo.com/en/docs#weathervariables
const WMO_DESCRIPTIONS: Record<number, string> = {
  0: 'clear sky',
  1: 'mostly clear',
  2: 'partly cloudy',
  3: 'overcast',
  45: 'fog',
  48: 'depositing rime fog',
  51: 'light drizzle',
  53: 'moderate drizzle',
  55: 'dense drizzle',
  61: 'light rain',
  63: 'moderate rain',
  65: 'heavy rain',
  71: 'light snow',
  73: 'moderate snow',
  75: 'heavy snow',
  80: 'light rain showers',
  81: 'moderate rain showers',
  82: 'violent rain showers',
  95: 'thunderstorm',
  96: 'thunderstorm with hail',
  99: 'severe thunderstorm with hail',
};

export interface WeatherSnapshot {
  summary: string; // human-friendly one-liner, safe to feed straight into a prompt
  temperatureC: number | null;
  willRain: boolean;
}

/**
 * Fetches current weather for the given coordinates. Falls back to a neutral,
 * clearly-labelled default if the API call fails, so the rest of the app never breaks.
 */
export async function getWeatherSummary(
  lat: number | null | undefined,
  lon: number | null | undefined
): Promise<WeatherSnapshot> {
  const latitude = lat ?? DEFAULT_LAT;
  const longitude = lon ?? DEFAULT_LON;

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,precipitation,weather_code&timezone=auto`;
    const res = await fetch(url, { next: { revalidate: 1800 } }); // cache 30 min

    if (!res.ok) throw new Error(`Open-Meteo responded ${res.status}`);

    const data = await res.json();
    const current = data?.current;
    if (!current) throw new Error('No current weather block in response');

    const temperatureC: number = current.temperature_2m;
    const code: number = current.weather_code;
    const precipitation: number = current.precipitation ?? 0;
    const description = WMO_DESCRIPTIONS[code] || 'unsettled conditions';
    const willRain = precipitation > 0 || (code >= 51 && code <= 82) || (code >= 95);

    return {
      summary: `${Math.round(temperatureC)}°C, ${description}`,
      temperatureC,
      willRain,
    };
  } catch (error) {
    console.error('getWeatherSummary error, using fallback:', error);
    return {
      summary: 'Mild conditions (weather lookup unavailable)',
      temperatureC: null,
      willRain: false,
    };
  }
}
