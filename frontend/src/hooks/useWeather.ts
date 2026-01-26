import { useState, useEffect, useCallback, useRef } from 'react';
import type { EnsembleForecast, Location } from '../types/weather';
import { getForecast, getSavedLocations } from '../api/client';

interface UseWeatherReturn {
  forecast: EnsembleForecast | null;
  savedLocations: Location[];
  loading: boolean;
  error: string | null;
  fetchForecast: (lat: number, lon: number) => Promise<void>;
  refreshSavedLocations: () => Promise<void>;
}

export function useWeather(): UseWeatherReturn {
  const [forecast, setForecast] = useState<EnsembleForecast | null>(null);
  const [savedLocations, setSavedLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasForecastRef = useRef(false);

  const fetchForecast = useCallback(async (lat: number, lon: number) => {
    // Only show loading state if we don't have existing data
    if (!hasForecastRef.current) {
      setLoading(true);
    }
    setError(null);

    try {
      const forecastData = await getForecast(lat, lon);
      setForecast(forecastData);
      hasForecastRef.current = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch forecast');
      // Don't clear existing forecast on error - keep showing old data
      if (!hasForecastRef.current) {
        setForecast(null);
      }
    } finally {
      setLoading(false);
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

  useEffect(() => {
    refreshSavedLocations();
  }, [refreshSavedLocations]);

  return {
    forecast,
    savedLocations,
    loading,
    error,
    fetchForecast,
    refreshSavedLocations,
  };
}
