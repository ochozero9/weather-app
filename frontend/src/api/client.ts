/**
 * API Client
 * ==========
 * Centralized API communication layer for the weather app.
 *
 * All API calls go through fetchApi() which handles:
 * - Error handling with user-friendly messages
 * - AbortController support for cancellable requests
 * - JSON parsing with error handling
 */

import type {
  AccuracyBadge,
  AccuracyMetrics,
  EnsembleForecast,
  GeocodingResult,
  Location,
  ModelComparison,
} from '../types/weather';

/**
 * API Base URL Construction
 *
 * IMPORTANT: This assumes the backend runs on the SAME HOSTNAME as the frontend,
 * just on port 8000. This works for:
 * - localhost development (localhost:5173 → localhost:8000)
 * - LAN access (192.168.x.x:5173 → 192.168.x.x:8000)
 * - Mobile testing on same network
 *
 * This will NOT work for:
 * - Different domains (api.example.com vs app.example.com)
 * - Production with reverse proxy (would need /api prefix without port)
 *
 * For production deployment, consider:
 * - Environment variable: import.meta.env.VITE_API_URL
 * - Reverse proxy: Nginx routing /api/* to backend
 */
const protocol = window.location.protocol;
const API_BASE = `${protocol}//${window.location.hostname}:8000/api`;

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    });
  } catch (err) {
    // Re-throw abort errors as-is so callers can handle them
    if (err instanceof Error && err.name === 'AbortError') {
      throw err;
    }
    throw new Error('Unable to connect to weather service. Check your connection.');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  // Handle JSON parsing errors gracefully
  try {
    return await response.json();
  } catch {
    throw new Error('Invalid response from weather service');
  }
}

// Forecast endpoints
export async function getForecast(lat: number, lon: number): Promise<EnsembleForecast> {
  return fetchApi<EnsembleForecast>(`/forecast?lat=${lat}&lon=${lon}`);
}

export async function getModelComparison(
  lat: number,
  lon: number,
  hourOffset = 0
): Promise<ModelComparison> {
  return fetchApi<ModelComparison>(
    `/forecast/models?lat=${lat}&lon=${lon}&hour_offset=${hourOffset}`
  );
}

export async function geocodeLocation(
  query: string,
  signal?: AbortSignal
): Promise<{ results: GeocodingResult[] }> {
  return fetchApi<{ results: GeocodingResult[] }>(
    `/forecast/geocode?query=${encodeURIComponent(query)}`,
    signal ? { signal } : undefined
  );
}

// Location endpoints
export async function saveLocation(location: Omit<Location, 'id'>): Promise<Location> {
  return fetchApi<Location>('/locations', {
    method: 'POST',
    body: JSON.stringify(location),
  });
}

export async function getSavedLocations(): Promise<Location[]> {
  return fetchApi<Location[]>('/locations');
}

export async function deleteLocation(id: number): Promise<void> {
  await fetchApi(`/locations/${id}`, { method: 'DELETE' });
}

// Accuracy endpoints
export async function getAccuracyMetrics(
  locationId?: number,
  days = 30
): Promise<AccuracyMetrics> {
  const params = new URLSearchParams({ days: days.toString() });
  if (locationId) params.set('location_id', locationId.toString());
  return fetchApi<AccuracyMetrics>(`/accuracy?${params}`);
}

export async function getAccuracyBadge(
  locationId?: number,
  leadHours = 72
): Promise<AccuracyBadge> {
  const params = new URLSearchParams({ lead_hours: leadHours.toString() });
  if (locationId) params.set('location_id', locationId.toString());
  return fetchApi<AccuracyBadge>(`/accuracy/badge?${params}`);
}
