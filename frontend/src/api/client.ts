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
let cachedModelData: RawModelForecast[] | null = null;

export async function getForecast(lat: number, lon: number): Promise<EnsembleForecast> {
  const [modelData, airQuality] = await Promise.all([
    fetchAllModels(lat, lon),
    fetchAirQuality(lat, lon),
  ]);

  cachedModelData = modelData;
  return calculateEnsemble(modelData, airQuality);
}

export async function getModelComparison(
  lat: number,
  lon: number,
  hourOffset = 0
): Promise<ModelComparison> {
  // Use cached data if available for the same location
  let modelData = cachedModelData;
  if (
    !modelData ||
    Math.abs(modelData[0].latitude - lat) > 0.01 ||
    Math.abs(modelData[0].longitude - lon) > 0.01
  ) {
    modelData = await fetchAllModels(lat, lon);
    cachedModelData = modelData;
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
