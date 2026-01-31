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

  const loadFromCache = useCallback((lat: number, lon: number): boolean => {
    const cached = loadCachedForecast(lat, lon);
    if (cached) {
      setForecast(cached);
      setIsStale(true); // Mark as stale until fresh data arrives
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

  const fetchForecast = useCallback(async (lat: number, lon: number) => {
    // Save location for retry
    lastLocationRef.current = { lat, lon };

    // If we have existing data, show refreshing state instead of loading
    if (hasForecastRef.current) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
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
      // Don't clear existing forecast on error - keep showing old data
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
