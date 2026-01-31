export type TempUnit = 'C' | 'F';

// Helper to convert Celsius to Fahrenheit
export function convertTemp(celsius: number, unit: TempUnit): number {
  if (unit === 'F') {
    return (celsius * 9) / 5 + 32;
  }
  return celsius;
}

// Re-export from centralized location
export { getWeatherDescription } from '../constants/weather';
