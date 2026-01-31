/**
 * useWeather Hook
 * ================
 * Manages weather forecast data fetching, caching, and state.
 *
 * Design Patterns:
 * - Stale-While-Revalidate: Shows cached data immediately, fetches fresh in background
 * - Graceful Degradation: On error, keeps showing old data rather than blank screen
 * - Loading vs Refreshing: Different UI states for initial load vs background refresh
 *
 * State Flow:
 * 1. Initial load: loading=true, show skeleton
 * 2. Cache loaded: isStale=true, show data with stale indicator
 * 3. Fresh data: isStale=false, loading=false
 * 4. Error with existing data: keep old data, show error toast (not implemented)
 * 5. Error without data: show error state
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import type { EnsembleForecast, Location } from '../types/weather';
import { getForecast, getSavedLocations } from '../api/client';
import { loadCachedForecast, saveForecastCache } from '../utils/storage';

interface UseWeatherReturn {
  forecast: EnsembleForecast | null;
  savedLocations: Location[];
  loading: boolean;
  isRefreshing: boolean;
  isStale: boolean;
  isOffline: boolean;
  error: string | null;
  fetchForecast: (lat: number, lon: number) => Promise<void>;
  refreshSavedLocations: () => Promise<void>;
  loadFromCache: (lat: number, lon: number) => boolean;
  retry: () => void;
}

export function useWeather(): UseWeatherReturn {
  const [forecast, setForecast] = useState<EnsembleForecast | null>(null);
  const [savedLocations, setSavedLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isStale, setIsStale] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [error, setError] = useState<string | null>(null);
  const hasForecastRef = useRef(false);
  const lastLocationRef = useRef<{ lat: number; lon: number } | null>(null);

  // Load forecast from localStorage cache for instant display
  // Returns true if cache hit, false if miss
  // Always marks data as stale - caller should fetch fresh data after
  const loadFromCache = useCallback((lat: number, lon: number): boolean => {
    const cached = loadCachedForecast(lat, lon);
    if (cached) {
      setForecast(cached);
      setIsStale(true); // Always stale until fresh fetch completes
      hasForecastRef.current = true;
      return true;
    }
    return false;
  }, []);

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch fresh forecast from API
  // UI state differs based on whether we already have data:
  // - No data: loading=true (shows skeleton)
  // - Has data: isRefreshing=true (shows subtle refresh indicator)
  const fetchForecast = useCallback(async (lat: number, lon: number) => {
    lastLocationRef.current = { lat, lon }; // Save for retry functionality

    // Different loading states for better UX
    if (hasForecastRef.current) {
      setIsRefreshing(true); // Background refresh - don't disrupt current view
    } else {
      setLoading(true); // Initial load - show loading skeleton
    }
    setError(null);

    try {
      const forecastData = await getForecast(lat, lon);
      setForecast(forecastData);
      saveForecastCache(forecastData);
      setIsStale(false); // Fresh data received
      hasForecastRef.current = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch forecast. Please try again.');
      // IMPORTANT: Don't clear existing forecast on error
      // Showing stale data is better than showing nothing
      // Only clear if we never had data to begin with
      if (!hasForecastRef.current) {
        setForecast(null);
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const refreshSavedLocations = useCallback(async () => {
    try {
      const locations = await getSavedLocations();
      setSavedLocations(locations);
    } catch {
      // Ignore errors for saved locations
    }
  }, []);

  // Retry last fetch
  const retry = useCallback(() => {
    if (lastLocationRef.current) {
      fetchForecast(lastLocationRef.current.lat, lastLocationRef.current.lon);
    }
  }, [fetchForecast]);

  useEffect(() => {
    refreshSavedLocations();
  }, [refreshSavedLocations]);

  return {
    forecast,
    savedLocations,
    loading,
    isRefreshing,
    isStale,
    isOffline,
    error,
    fetchForecast,
    refreshSavedLocations,
    loadFromCache,
    retry,
  };
}
