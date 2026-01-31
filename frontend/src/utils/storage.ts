import type { GeocodingResult, EnsembleForecast } from '../types/weather';
import type { TempUnit } from './weather';
import type { IconStyle } from '../components/WeatherIcon';

// Storage keys
const STORAGE_KEY = 'weather-app-last-location';
const THEME_STORAGE_KEY = 'weather-app-theme';
const UNIT_STORAGE_KEY = 'weather-app-unit';
const ICON_STORAGE_KEY = 'weather-app-icon-style';
const REMEMBER_LOCATION_KEY = 'weather-app-remember-location';
const RECENT_LOCATIONS_KEY = 'weather-app-recent-locations';
const SHOW_RECENT_KEY = 'weather-app-show-recent';
const QUICK_SWITCH_KEY = 'weather-app-quick-switch';
const AUTO_REFRESH_KEY = 'weather-app-auto-refresh';
const FORECAST_CACHE_KEY = 'weather-app-forecast-cache';
const MAX_RECENT_LOCATIONS = 5;

// Theme
export type Theme = 'default' | 'futuristic' | 'glass' | 'oled';

export function loadSavedTheme(): Theme {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'default' || saved === 'futuristic' || saved === 'glass' || saved === 'oled') {
      return saved;
    }
  } catch {
    // Ignore errors
  }
  return 'default';
}

export function saveTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Ignore storage errors
  }
}

// Temperature unit
export function loadSavedUnit(): TempUnit {
  try {
    const saved = localStorage.getItem(UNIT_STORAGE_KEY);
    if (saved === 'C' || saved === 'F') {
      return saved;
    }
  } catch {
    // Ignore errors
  }
  return 'C';
}

export function saveUnit(unit: TempUnit): void {
  try {
    localStorage.setItem(UNIT_STORAGE_KEY, unit);
  } catch {
    // Ignore storage errors
  }
}

// Icon style
export function loadSavedIconStyle(): IconStyle {
  try {
    const saved = localStorage.getItem(ICON_STORAGE_KEY);
    if (saved === 'emoji' || saved === 'meteocons' || saved === 'wiIcons' || saved === 'filled') {
      return saved as IconStyle;
    }
  } catch {
    // Ignore errors
  }
  return 'wiIcons';
}

export function saveIconStyle(style: IconStyle): void {
  try {
    localStorage.setItem(ICON_STORAGE_KEY, style);
  } catch {
    // Ignore storage errors
  }
}

// Remember location setting
export function loadRememberLocation(): boolean {
  try {
    const saved = localStorage.getItem(REMEMBER_LOCATION_KEY);
    return saved !== 'false'; // Default to true
  } catch {
    return true;
  }
}

export function saveRememberLocation(remember: boolean): void {
  try {
    localStorage.setItem(REMEMBER_LOCATION_KEY, String(remember));
  } catch {
    // Ignore storage errors
  }
}

// Show recent locations setting
export function loadShowRecent(): boolean {
  try {
    const saved = localStorage.getItem(SHOW_RECENT_KEY);
    return saved === 'true';
  } catch {
    return false;
  }
}

export function saveShowRecent(show: boolean): void {
  try {
    localStorage.setItem(SHOW_RECENT_KEY, String(show));
  } catch {
    // Ignore storage errors
  }
}

// Quick switch setting
export function loadQuickSwitch(): boolean {
  try {
    const saved = localStorage.getItem(QUICK_SWITCH_KEY);
    return saved !== 'false'; // Default to true
  } catch {
    return true;
  }
}

export function saveQuickSwitch(enabled: boolean): void {
  try {
    localStorage.setItem(QUICK_SWITCH_KEY, String(enabled));
  } catch {
    // Ignore storage errors
  }
}

// Auto-refresh interval (in minutes)
export type AutoRefreshInterval = 5 | 10 | 15 | 30 | 60;

const VALID_INTERVALS: AutoRefreshInterval[] = [5, 10, 15, 30, 60];

export function loadAutoRefreshInterval(): AutoRefreshInterval {
  try {
    const saved = localStorage.getItem(AUTO_REFRESH_KEY);
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (VALID_INTERVALS.includes(parsed as AutoRefreshInterval)) {
        return parsed as AutoRefreshInterval;
      }
    }
  } catch {
    // Ignore errors
  }
  return 5; // Default to 5 minutes
}

export function saveAutoRefreshInterval(interval: AutoRefreshInterval): void {
  try {
    localStorage.setItem(AUTO_REFRESH_KEY, String(interval));
  } catch {
    // Ignore storage errors
  }
}

// Recent locations
export function loadRecentLocations(): GeocodingResult[] {
  try {
    const saved = localStorage.getItem(RECENT_LOCATIONS_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // Ignore parse errors
  }
  return [];
}

export function saveRecentLocations(locations: GeocodingResult[]): void {
  try {
    localStorage.setItem(RECENT_LOCATIONS_KEY, JSON.stringify(locations));
  } catch {
    // Ignore storage errors
  }
}

export function addToRecentLocations(location: GeocodingResult, existing: GeocodingResult[]): GeocodingResult[] {
  // Remove if already exists (by lat/lon)
  const filtered = existing.filter(
    loc => !(loc.latitude === location.latitude && loc.longitude === location.longitude)
  );
  // Add to front and limit to MAX_RECENT_LOCATIONS
  return [location, ...filtered].slice(0, MAX_RECENT_LOCATIONS);
}

// Current location
export function loadSavedLocation(): GeocodingResult | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

export function saveLocation(location: GeocodingResult): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(location));
  } catch {
    // Ignore storage errors
  }
}

export function clearLocationData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(RECENT_LOCATIONS_KEY);
  } catch {
    // Ignore storage errors
  }
}

// Forecast cache
interface CachedForecast {
  forecast: EnsembleForecast;
  timestamp: number;
  locationKey: string;
}

const CACHE_MAX_AGE_MS = 60 * 60 * 1000; // 1 hour max age for cache

export function loadCachedForecast(lat: number, lon: number): EnsembleForecast | null {
  try {
    const saved = localStorage.getItem(FORECAST_CACHE_KEY);
    if (saved) {
      const cached: CachedForecast = JSON.parse(saved);
      const locationKey = `${lat.toFixed(2)},${lon.toFixed(2)}`;

      // Check if cache is for the same location and not too old
      if (cached.locationKey === locationKey &&
          Date.now() - cached.timestamp < CACHE_MAX_AGE_MS) {
        return cached.forecast;
      }
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

export function saveForecastCache(forecast: EnsembleForecast): void {
  try {
    const cached: CachedForecast = {
      forecast,
      timestamp: Date.now(),
      locationKey: `${forecast.location.latitude.toFixed(2)},${forecast.location.longitude.toFixed(2)}`
    };
    localStorage.setItem(FORECAST_CACHE_KEY, JSON.stringify(cached));
  } catch {
    // Ignore storage errors (e.g., quota exceeded)
  }
}
