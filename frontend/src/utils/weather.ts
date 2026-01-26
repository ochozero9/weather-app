export type TempUnit = 'C' | 'F';

// Helper to convert Celsius to Fahrenheit
export function convertTemp(celsius: number, unit: TempUnit): number {
  if (unit === 'F') {
    return (celsius * 9) / 5 + 32;
  }
  return celsius;
}

// Weather code descriptions
const WEATHER_CODES: Record<number, { description: string }> = {
  0: { description: 'Clear sky' },
  1: { description: 'Mainly clear' },
  2: { description: 'Partly cloudy' },
  3: { description: 'Overcast' },
  45: { description: 'Fog' },
  48: { description: 'Depositing rime fog' },
  51: { description: 'Light drizzle' },
  53: { description: 'Moderate drizzle' },
  55: { description: 'Dense drizzle' },
  56: { description: 'Light freezing drizzle' },
  57: { description: 'Dense freezing drizzle' },
  61: { description: 'Slight rain' },
  63: { description: 'Moderate rain' },
  65: { description: 'Heavy rain' },
  66: { description: 'Light freezing rain' },
  67: { description: 'Heavy freezing rain' },
  71: { description: 'Slight snow' },
  73: { description: 'Moderate snow' },
  75: { description: 'Heavy snow' },
  77: { description: 'Snow grains' },
  80: { description: 'Slight rain showers' },
  81: { description: 'Moderate rain showers' },
  82: { description: 'Violent rain showers' },
  85: { description: 'Slight snow showers' },
  86: { description: 'Heavy snow showers' },
  95: { description: 'Thunderstorm' },
  96: { description: 'Thunderstorm with slight hail' },
  99: { description: 'Thunderstorm with heavy hail' },
};

export function getWeatherDescription(code: number): string {
  return WEATHER_CODES[code]?.description || 'Unknown';
}
