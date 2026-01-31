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

// ============================================
// Generic storage helpers
// ============================================

function loadString<T extends string>(
  key: string,
  validate: (value: string | null) => value is T,
  defaultValue: T
): T {
  try {
    const saved = localStorage.getItem(key);
    return validate(saved) ? saved : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveString(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore storage errors
  }
}

function loadBoolean(key: string, defaultValue: boolean): boolean {
  try {
    const saved = localStorage.getItem(key);
    if (saved === null) return defaultValue;
    return saved === 'true';
  } catch {
    return defaultValue;
  }
}

function saveBoolean(key: string, value: boolean): void {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // Ignore storage errors
  }
}

function loadJson<T>(key: string, defaultValue: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveJson<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage errors
  }
}

// ============================================
// Theme
// ============================================

export type Theme = 'default' | 'futuristic' | 'glass' | 'oled';

const isTheme = (v: string | null): v is Theme =>
  v === 'default' || v === 'futuristic' || v === 'glass' || v === 'oled';

export const loadSavedTheme = (): Theme => loadString(THEME_STORAGE_KEY, isTheme, 'default');
export const saveTheme = (theme: Theme): void => saveString(THEME_STORAGE_KEY, theme);

// ============================================
// Temperature unit
// ============================================

const isTempUnit = (v: string | null): v is TempUnit => v === 'C' || v === 'F';

export const loadSavedUnit = (): TempUnit => loadString(UNIT_STORAGE_KEY, isTempUnit, 'C');
export const saveUnit = (unit: TempUnit): void => saveString(UNIT_STORAGE_KEY, unit);

// ============================================
// Icon style
// ============================================

const isIconStyle = (v: string | null): v is IconStyle =>
  v === 'emoji' || v === 'meteocons' || v === 'wiIcons' || v === 'filled';

export const loadSavedIconStyle = (): IconStyle => loadString(ICON_STORAGE_KEY, isIconStyle, 'wiIcons');
export const saveIconStyle = (style: IconStyle): void => saveString(ICON_STORAGE_KEY, style);

// ============================================
// Boolean settings
// ============================================

export const loadRememberLocation = (): boolean => loadBoolean(REMEMBER_LOCATION_KEY, true);
export const saveRememberLocation = (remember: boolean): void => saveBoolean(REMEMBER_LOCATION_KEY, remember);

export const loadShowRecent = (): boolean => loadBoolean(SHOW_RECENT_KEY, false);
export const saveShowRecent = (show: boolean): void => saveBoolean(SHOW_RECENT_KEY, show);

export const loadQuickSwitch = (): boolean => loadBoolean(QUICK_SWITCH_KEY, true);
export const saveQuickSwitch = (enabled: boolean): void => saveBoolean(QUICK_SWITCH_KEY, enabled);

// ============================================
// Auto-refresh interval
// ============================================

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
  return 5;
}

export const saveAutoRefreshInterval = (interval: AutoRefreshInterval): void =>
  saveString(AUTO_REFRESH_KEY, String(interval));

// ============================================
// Recent locations
// ============================================

export const loadRecentLocations = (): GeocodingResult[] => loadJson(RECENT_LOCATIONS_KEY, []);
export const saveRecentLocations = (locations: GeocodingResult[]): void =>
  saveJson(RECENT_LOCATIONS_KEY, locations);

export function addToRecentLocations(location: GeocodingResult, existing: GeocodingResult[]): GeocodingResult[] {
  const filtered = existing.filter(
    loc => !(loc.latitude === location.latitude && loc.longitude === location.longitude)
  );
  return [location, ...filtered].slice(0, MAX_RECENT_LOCATIONS);
}

// ============================================
// Current location
// ============================================

export const loadSavedLocation = (): GeocodingResult | null => loadJson(STORAGE_KEY, null);
export const saveLocation = (location: GeocodingResult): void => saveJson(STORAGE_KEY, location);

export function clearLocationData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(RECENT_LOCATIONS_KEY);
  } catch {
    // Ignore storage errors
  }
}

// ============================================
// Forecast cache
// ============================================

interface CachedForecast {
  forecast: EnsembleForecast;
  timestamp: number;
  locationKey: string;
}

const CACHE_MAX_AGE_MS = 60 * 60 * 1000; // 1 hour

export function loadCachedForecast(lat: number, lon: number): EnsembleForecast | null {
  try {
    const saved = localStorage.getItem(FORECAST_CACHE_KEY);
    if (saved) {
      const cached: CachedForecast = JSON.parse(saved);
      const locationKey = `${lat.toFixed(2)},${lon.toFixed(2)}`;
      if (cached.locationKey === locationKey && Date.now() - cached.timestamp < CACHE_MAX_AGE_MS) {
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
