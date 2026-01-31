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

// Cache raw model data for model comparison without re-fetching
interface CachedModelData {
  data: RawModelForecast[];
  timestamp: number;
  latitude: number;
  longitude: number;
}

const MODEL_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
let cachedModelData: CachedModelData | null = null;
let inFlightRequest: Promise<RawModelForecast[]> | null = null;
let inFlightCoords: { lat: number; lon: number } | null = null;

function isModelCacheValid(lat: number, lon: number): boolean {
  if (!cachedModelData) return false;
  const isExpired = Date.now() - cachedModelData.timestamp > MODEL_CACHE_TTL_MS;
  const isSameLocation =
    Math.abs(cachedModelData.latitude - lat) <= 0.01 &&
    Math.abs(cachedModelData.longitude - lon) <= 0.01;
  return !isExpired && isSameLocation;
}

export async function getForecast(lat: number, lon: number): Promise<EnsembleForecast> {
  // Reuse in-flight request for same coordinates to prevent race conditions
  const isSameCoords = inFlightCoords &&
    Math.abs(inFlightCoords.lat - lat) <= 0.01 &&
    Math.abs(inFlightCoords.lon - lon) <= 0.01;

  let modelDataPromise: Promise<RawModelForecast[]>;
  if (inFlightRequest && isSameCoords) {
    modelDataPromise = inFlightRequest;
  } else {
    inFlightCoords = { lat, lon };
    inFlightRequest = fetchAllModels(lat, lon);
    modelDataPromise = inFlightRequest;
  }

  const [modelData, airQuality] = await Promise.all([
    modelDataPromise,
    fetchAirQuality(lat, lon),
  ]);

  // Clear in-flight tracking
  inFlightRequest = null;
  inFlightCoords = null;

  cachedModelData = {
    data: modelData,
    timestamp: Date.now(),
    latitude: lat,
    longitude: lon,
  };
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
