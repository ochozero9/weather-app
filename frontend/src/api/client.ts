/**
 * API Client
 * ==========
 * Self-contained weather data layer. All data is fetched directly
 * from Open-Meteo APIs and processed in the browser.
 * No backend server required.
 *
 * Architecture:
 * - fetchAllModels() → 6 parallel requests to Open-Meteo
 * - calculateEnsemble() → weighted averaging in browser
 * - Raw model data cached for model comparison view
 */

import type {
  EnsembleForecast,
  GeocodingResult,
  Location,
  ModelComparison,
} from '../types/weather';
import { fetchAllModels, fetchAirQuality, geocodeLocation as geoSearch } from '../services/openMeteo';
import { calculateEnsemble, buildModelComparison } from '../services/ensemble';
import type { RawModelForecast } from '../services/openMeteo';

// ============================================
// Model Data Caching
// ============================================
// Raw model data is cached separately from the processed ensemble forecast.
// This allows the ModelComparison view to access individual model predictions
// without re-fetching all 6 models from Open-Meteo.

interface CachedModelData {
  data: RawModelForecast[];
  timestamp: number;
  latitude: number;
  longitude: number;
}

const MODEL_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes - weather doesn't change that fast
let cachedModelData: CachedModelData | null = null;

// In-flight request tracking prevents "thundering herd" problem:
// If user rapidly switches locations or triggers multiple fetches,
// we reuse the pending request instead of spawning duplicates.
let inFlightRequest: Promise<RawModelForecast[]> | null = null;
let inFlightCoords: { lat: number; lon: number } | null = null;

/**
 * Check if cached model data is still valid for the given coordinates.
 * Location tolerance of 0.01° ≈ 1.1km - close enough for weather data.
 */
function isModelCacheValid(lat: number, lon: number): boolean {
  if (!cachedModelData) return false;
  const isExpired = Date.now() - cachedModelData.timestamp > MODEL_CACHE_TTL_MS;
  // 0.01° tolerance: roughly 1.1km at equator, less at higher latitudes
  // This is acceptable because weather data has ~1km resolution anyway
  const isSameLocation =
    Math.abs(cachedModelData.latitude - lat) <= 0.01 &&
    Math.abs(cachedModelData.longitude - lon) <= 0.01;
  return !isExpired && isSameLocation;
}

/**
 * Fetch weather forecast for given coordinates.
 * Returns ensemble forecast (weighted average of 6 weather models).
 *
 * Request deduplication: If a request for the same location is already
 * in flight, we return that promise instead of making a duplicate request.
 * This prevents race conditions when React strict mode double-mounts or
 * when user rapidly interacts with location controls.
 */
export async function getForecast(lat: number, lon: number): Promise<EnsembleForecast> {
  // Check if we can reuse an in-flight request (same coordinates within tolerance)
  const isSameCoords = inFlightCoords &&
    Math.abs(inFlightCoords.lat - lat) <= 0.01 &&
    Math.abs(inFlightCoords.lon - lon) <= 0.01;

  let modelDataPromise: Promise<RawModelForecast[]>;
  if (inFlightRequest && isSameCoords) {
    // Reuse existing request - prevents duplicate API calls
    modelDataPromise = inFlightRequest;
  } else {
    // New request - track it for potential reuse
    inFlightCoords = { lat, lon };
    inFlightRequest = fetchAllModels(lat, lon);
    modelDataPromise = inFlightRequest;
  }

  // Fetch model data and air quality in parallel
  const [modelData, airQuality] = await Promise.all([
    modelDataPromise,
    fetchAirQuality(lat, lon),
  ]);

  // Clear in-flight tracking after request completes
  inFlightRequest = null;
  inFlightCoords = null;

  // Cache raw model data for ModelComparison view
  cachedModelData = {
    data: modelData,
    timestamp: Date.now(),
    latitude: lat,
    longitude: lon,
  };

  // Process raw model data into weighted ensemble forecast
  return calculateEnsemble(modelData, airQuality);
}

export async function getModelComparison(
  lat: number,
  lon: number,
  hourOffset = 0
): Promise<ModelComparison> {
  // Use cached data if valid (same location and not expired)
  let modelData: RawModelForecast[];
  if (isModelCacheValid(lat, lon)) {
    modelData = cachedModelData!.data;
  } else {
    modelData = await fetchAllModels(lat, lon);
    cachedModelData = {
      data: modelData,
      timestamp: Date.now(),
      latitude: lat,
      longitude: lon,
    };
  }
  return buildModelComparison(modelData, hourOffset);
}

export async function geocodeLocation(
  query: string,
  signal?: AbortSignal
): Promise<{ results: GeocodingResult[] }> {
  const results = await geoSearch(query, 5, signal);
  return { results };
}

// Location storage via localStorage (no backend needed)
const SAVED_LOCATIONS_KEY = 'weather-app-saved-locations';
let nextId = Date.now();

export async function saveLocation(location: Omit<Location, 'id'>): Promise<Location> {
  const locations = await getSavedLocations();
  // Prevent duplicates by coordinates
  const existing = locations.find(
    (l) => Math.abs(l.latitude - location.latitude) < 0.01 && Math.abs(l.longitude - location.longitude) < 0.01
  );
  if (existing) return existing;

  const newLoc: Location = { ...location, id: nextId++ };
  locations.unshift(newLoc);
  localStorage.setItem(SAVED_LOCATIONS_KEY, JSON.stringify(locations));
  return newLoc;
}

export async function getSavedLocations(): Promise<Location[]> {
  try {
    const saved = localStorage.getItem(SAVED_LOCATIONS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export async function deleteLocation(id: number): Promise<void> {
  const locations = await getSavedLocations();
  const filtered = locations.filter((l) => l.id !== id);
  localStorage.setItem(SAVED_LOCATIONS_KEY, JSON.stringify(filtered));
}
