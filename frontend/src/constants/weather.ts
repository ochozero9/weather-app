// Weather code classifications from WMO
export const SNOW_CODES = [71, 73, 75, 77, 85, 86] as const;
export const RAIN_CODES = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99] as const;

export function isSnowCode(code: number): boolean {
  return SNOW_CODES.includes(code as typeof SNOW_CODES[number]);
}

export function isRainCode(code: number): boolean {
  return RAIN_CODES.includes(code as typeof RAIN_CODES[number]);
}

// Unit conversions
export const CONVERSIONS = {
  MM_TO_INCHES: 0.0394,
  METERS_TO_MILES: 0.000621371,
  SNOW_RATIO: 10, // 10:1 snow to water ratio
} as const;

// Mobile breakpoint
export const MOBILE_BREAKPOINT = 768;
