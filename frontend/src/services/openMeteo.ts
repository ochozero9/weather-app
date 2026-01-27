/**
 * Open-Meteo API Client
 * =====================
 * Direct browser-side client for Open-Meteo APIs.
 * No API key required. CORS supported.
 *
 * Endpoints used:
 * - Forecast API: https://api.open-meteo.com/v1/forecast
 * - Archive API: https://archive-api.open-meteo.com/v1/archive
 * - Air Quality API: https://air-quality-api.open-meteo.com/v1/air-quality
 * - Geocoding API: https://geocoding-api.open-meteo.com/v1/search
 * - Zippopotam.us: https://api.zippopotam.us (ZIP code lookup)
 */

const FORECAST_BASE = 'https://api.open-meteo.com/v1/forecast';
const AIR_QUALITY_BASE = 'https://air-quality-api.open-meteo.com/v1/air-quality';
const GEOCODING_BASE = 'https://geocoding-api.open-meteo.com/v1/search';
const ZIPPOPOTAM_BASE = 'https://api.zippopotam.us';

export const WEATHER_MODELS = [
  'gfs_seamless',
  'ecmwf_ifs04',
  'icon_seamless',
  'gem_seamless',
  'jma_seamless',
  'meteofrance_seamless',
] as const;

export type WeatherModel = (typeof WEATHER_MODELS)[number];

export const MODEL_WEIGHTS: Record<WeatherModel, number> = {
  gfs_seamless: 1.0,
  ecmwf_ifs04: 1.2,
  icon_seamless: 1.0,
  gem_seamless: 0.9,
  jma_seamless: 0.9,
  meteofrance_seamless: 1.0,
};

const HOURLY_PARAMS = [
  'temperature_2m',
  'relative_humidity_2m',
  'dew_point_2m',
  'cloud_cover',
  'precipitation',
  'precipitation_probability',
  'weather_code',
  'wind_speed_10m',
  'wind_direction_10m',
].join(',');

const DAILY_PARAMS = [
  'temperature_2m_max',
  'temperature_2m_min',
  'precipitation_sum',
  'precipitation_probability_max',
  'weather_code',
  'wind_speed_10m_max',
  'sunrise',
  'sunset',
].join(',');

const CURRENT_PARAMS = [
  'temperature_2m',
  'apparent_temperature',
  'relative_humidity_2m',
  'precipitation',
  'weather_code',
  'wind_speed_10m',
  'wind_direction_10m',
  'uv_index',
  'visibility',
].join(',');

export interface RawModelForecast {
  model: WeatherModel;
  latitude: number;
  longitude: number;
  timezone: string;
  hourly: {
    time: string[];
    temperature_2m: (number | null)[];
    relative_humidity_2m: (number | null)[];
    dew_point_2m: (number | null)[];
    cloud_cover: (number | null)[];
    precipitation: (number | null)[];
    precipitation_probability: (number | null)[];
    weather_code: (number | null)[];
    wind_speed_10m: (number | null)[];
    wind_direction_10m: (number | null)[];
  };
  daily: {
    time: string[];
    temperature_2m_max: (number | null)[];
    temperature_2m_min: (number | null)[];
    precipitation_sum: (number | null)[];
    precipitation_probability_max: (number | null)[];
    weather_code: (number | null)[];
    wind_speed_10m_max: (number | null)[];
    sunrise: (string | null)[];
    sunset: (string | null)[];
  };
  current?: {
    temperature_2m: number | null;
    apparent_temperature: number | null;
    relative_humidity_2m: number | null;
    precipitation: number | null;
    weather_code: number | null;
    wind_speed_10m: number | null;
    wind_direction_10m: number | null;
    uv_index: number | null;
    visibility: number | null;
  };
}

export interface AirQualityData {
  us_aqi: number | null;
  pm2_5: number | null;
  pm10: number | null;
}

// Re-export from central types to avoid duplication
import type { GeocodingResult } from '../types/weather';
export type { GeocodingResult };

/**
 * Fetch forecast from a single weather model.
 */
async function fetchModelForecast(
  lat: number,
  lon: number,
  model: WeatherModel
): Promise<RawModelForecast | null> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    timezone: 'auto',
    forecast_days: '10',
    models: model,
    hourly: HOURLY_PARAMS,
    daily: DAILY_PARAMS,
    current: CURRENT_PARAMS,
  });

  try {
    const resp = await fetch(`${FORECAST_BASE}?${params}`, { signal: AbortSignal.timeout(30000) });
    if (!resp.ok) return null;
    const data = await resp.json();
    return { model, ...data };
  } catch {
    return null;
  }
}

/**
 * Fetch forecasts from all 6 models in parallel.
 * Returns only successful results (partial failures are fine).
 */
export async function fetchAllModels(
  lat: number,
  lon: number
): Promise<RawModelForecast[]> {
  const results = await Promise.all(
    WEATHER_MODELS.map((model) => fetchModelForecast(lat, lon, model))
  );
  const valid = results.filter((r): r is RawModelForecast => r !== null);
  if (valid.length === 0) {
    throw new Error('Unable to fetch weather data. All models failed.');
  }
  return valid;
}

/**
 * Fetch air quality index.
 */
export async function fetchAirQuality(lat: number, lon: number): Promise<AirQualityData | null> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    timezone: 'auto',
    current: 'us_aqi,pm2_5,pm10',
  });

  try {
    const resp = await fetch(`${AIR_QUALITY_BASE}?${params}`, { signal: AbortSignal.timeout(10000) });
    if (!resp.ok) return null;
    const data = await resp.json();
    return data.current || null;
  } catch {
    return null;
  }
}

/**
 * Geocode a location by name.
 */
export async function geocodeByName(
  query: string,
  limit = 5,
  signal?: AbortSignal
): Promise<GeocodingResult[]> {
  const params = new URLSearchParams({
    name: query,
    count: limit.toString(),
    language: 'en',
    format: 'json',
  });

  const resp = await fetch(`${GEOCODING_BASE}?${params}`, { signal });
  if (!resp.ok) return [];
  const data = await resp.json();
  return (data.results || []).map((r: Record<string, unknown>) => ({
    name: r.name as string,
    latitude: r.latitude as number,
    longitude: r.longitude as number,
    country: r.country as string,
    admin1: (r.admin1 as string) || '',
    timezone: r.timezone as string,
  }));
}

// ZIP code detection

function isZipCode(query: string): boolean {
  const clean = query.trim().replace(/[\s-]/g, '');
  // US: 5 digits or 5+4
  if (/^\d{5}(\d{4})?$/.test(clean)) return true;
  // Canada: alternating letter-digit
  if (clean.length === 6 && /^[A-Za-z]\d[A-Za-z]\d[A-Za-z]\d$/.test(clean)) return true;
  // UK: loose match
  if (clean.length >= 5 && /\d/.test(clean) && /[A-Za-z]/.test(clean)) return true;
  return false;
}

function getCountryFromZip(query: string): string {
  const clean = query.trim().replace(/[\s-]/g, '');
  if (/^\d{5}(\d{4})?$/.test(clean)) return 'us';
  if (clean.length === 6 && /^[A-Za-z]\d[A-Za-z]\d[A-Za-z]\d$/.test(clean)) return 'ca';
  return 'gb';
}

async function geocodeByZip(
  query: string,
  signal?: AbortSignal
): Promise<GeocodingResult[]> {
  const country = getCountryFromZip(query);
  const zip = query.trim().replace(/\s/g, '');

  try {
    const resp = await fetch(`${ZIPPOPOTAM_BASE}/${country}/${zip}`, { signal });
    if (!resp.ok) return [];
    const data = await resp.json();
    const place = data.places?.[0];
    if (!place) return [];

    return [{
      name: `${place['place name']}, ${place['state abbreviation'] || place.state || ''}`.trim(),
      latitude: parseFloat(place.latitude),
      longitude: parseFloat(place.longitude),
      country: data['country abbreviation'] || country.toUpperCase(),
      admin1: place.state || place['state abbreviation'] || '',
      timezone: 'auto',
    }];
  } catch {
    return [];
  }
}

/**
 * Search for locations by name or ZIP/postal code.
 * Handles deduplication of results.
 */
export async function geocodeLocation(
  query: string,
  limit = 5,
  signal?: AbortSignal
): Promise<GeocodingResult[]> {
  const results: GeocodingResult[] = [];

  if (isZipCode(query)) {
    // Fetch ZIP and name results in parallel
    const [zipResults, nameResults] = await Promise.all([
      geocodeByZip(query, signal),
      geocodeByName(query, limit, signal),
    ]);
    results.push(...zipResults, ...nameResults);
  } else {
    const nameResults = await geocodeByName(query, limit, signal);
    results.push(...nameResults);
  }

  // Deduplicate by coordinates (within 0.01 degree tolerance)
  const unique: GeocodingResult[] = [];
  for (const r of results) {
    const isDup = unique.some(
      (u) => Math.abs(u.latitude - r.latitude) < 0.01 && Math.abs(u.longitude - r.longitude) < 0.01
    );
    if (!isDup) unique.push(r);
  }

  return unique.slice(0, limit);
}
