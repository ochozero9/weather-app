import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useWeather } from './hooks/useWeather';
import { LocationSearch } from './components/LocationSearch';
import { UnifiedWeather } from './components/UnifiedWeather';
import { WeatherSkeleton } from './components/WeatherSkeleton';

// Lazy load Settings - only loaded when user opens settings
const Settings = lazy(() => import('./components/Settings').then(m => ({ default: m.Settings })));
import type { IconStyle } from './components/WeatherIcon';
import type { GeocodingResult } from './types/weather';
import type { TempUnit } from './utils/weather';
import {
  type Theme,
  type AutoRefreshInterval,
  loadSavedTheme,
  saveTheme,
  loadSavedUnit,
  saveUnit,
  loadSavedIconStyle,
  saveIconStyle,
  loadRememberLocation,
  saveRememberLocation,
  loadShowRecent,
  saveShowRecent,
  loadQuickSwitch,
  saveQuickSwitch,
  loadAutoRefreshInterval,
  saveAutoRefreshInterval,
  loadRecentLocations,
  saveRecentLocations,
  addToRecentLocations,
  loadSavedLocation,
  saveLocation,
  clearLocationData,
} from './utils/storage';
import './App.css';
import './styles/theme-futuristic.css';
import './styles/theme-glass.css';
import './styles/theme-oled.css';

// Find the index of the current hour in the hourly array
function getCurrentHourIndex(hourly: { time: string }[]): number {
  const now = new Date();
  const currentHour = now.getHours();
  const currentDate = now.toISOString().split('T')[0];

  for (let i = 0; i < hourly.length; i++) {
    const hourTime = new Date(hourly[i].time);
    const hourDate = hourly[i].time.split('T')[0];
    if (hourDate === currentDate && hourTime.getHours() === currentHour) {
      return i;
    }
    // If we passed the current hour, return the previous valid index
    if (hourTime > now && i > 0) {
      return i;
    }
  }
  return 0;
}

function App() {
  const { forecast, loading, isRefreshing, isStale, isOffline, error, fetchForecast, loadFromCache, retry } = useWeather();
  const [rememberLocation, setRememberLocation] = useState(loadRememberLocation);
  const [showRecentLocations, setShowRecentLocations] = useState(loadShowRecent);
  const [quickSwitch, setQuickSwitch] = useState(loadQuickSwitch);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<AutoRefreshInterval>(loadAutoRefreshInterval);
  const [recentLocations, setRecentLocations] = useState<GeocodingResult[]>(loadRecentLocations);
  const [selectedLocation, setSelectedLocation] = useState<GeocodingResult | null>(() =>
    loadRememberLocation() ? loadSavedLocation() : null
  );
  const [theme, setTheme] = useState<Theme>(loadSavedTheme);
  const [tempUnit, setTempUnit] = useState<TempUnit>(loadSavedUnit);
  const [iconStyle, setIconStyle] = useState<IconStyle>(loadSavedIconStyle);
  const [showSettings, setShowSettings] = useState(false);
  const [debugErrorStates, setDebugErrorStates] = useState(false);
  const initialFetchDone = useRef(false);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    saveTheme(theme);
  }, [theme]);

  // Prevent background scroll when settings is open
  useEffect(() => {
    if (showSettings) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showSettings]);

  // Save temperature unit
  useEffect(() => {
    saveUnit(tempUnit);
  }, [tempUnit]);

  // Save icon style
  useEffect(() => {
    saveIconStyle(iconStyle);
  }, [iconStyle]);

  // Save remember location setting
  useEffect(() => {
    saveRememberLocation(rememberLocation);
  }, [rememberLocation]);

  // Save show recent locations setting
  useEffect(() => {
    saveShowRecent(showRecentLocations);
  }, [showRecentLocations]);

  // Save quick switch setting
  useEffect(() => {
    saveQuickSwitch(quickSwitch);
  }, [quickSwitch]);

  // Save auto-refresh interval setting
  useEffect(() => {
    saveAutoRefreshInterval(autoRefreshInterval);
  }, [autoRefreshInterval]);

  // Auto-refresh timer
  useEffect(() => {
    if (!selectedLocation) return;

    const intervalMs = autoRefreshInterval * 60 * 1000;
    const timer = setInterval(() => {
      fetchForecast(selectedLocation.latitude, selectedLocation.longitude);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [selectedLocation, autoRefreshInterval, fetchForecast]);

  // Keyboard shortcuts for temperature unit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key.toLowerCase() === 'f') {
        setTempUnit('F');
      } else if (e.key.toLowerCase() === 'c') {
        setTempUnit('C');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Load cached forecast and fetch fresh data on startup
  useEffect(() => {
    if (initialFetchDone.current || !selectedLocation) return;
    initialFetchDone.current = true;

    // Try to load from cache first for instant display
    loadFromCache(selectedLocation.latitude, selectedLocation.longitude);

    // Then fetch fresh data
    fetchForecast(selectedLocation.latitude, selectedLocation.longitude);
  }, [selectedLocation, fetchForecast, loadFromCache]);

  const handleLocationSelect = async (location: GeocodingResult) => {
    setSelectedLocation(location);
    setShowSettings(false);
    if (rememberLocation) {
      saveLocation(location);
    }
    // Save to recent locations if either feature is enabled
    if (showRecentLocations || quickSwitch) {
      const updated = addToRecentLocations(location, recentLocations);
      setRecentLocations(updated);
      saveRecentLocations(updated);
    }
    await fetchForecast(location.latitude, location.longitude);
  };

  const handleRemoveRecentLocation = (location: GeocodingResult, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the select
    const updated = recentLocations.filter(
      loc => !(loc.latitude === location.latitude && loc.longitude === location.longitude)
    );
    setRecentLocations(updated);
    saveRecentLocations(updated);
  };

  const handleRefresh = () => {
    if (selectedLocation) {
      fetchForecast(selectedLocation.latitude, selectedLocation.longitude);
    }
  };

  const handleResetOnboarding = () => {
    // Clear all location data
    setSelectedLocation(null);
    setRecentLocations([]);
    clearLocationData();
    // Force a re-render by clearing forecast state (via the hook)
    window.location.reload();
  };

  // Onboarding: show when no location has been selected yet
  const isOnboarding = !selectedLocation && !forecast;

  return (
    <div className="app">
      {/* Onboarding Screen */}
      {isOnboarding && (
        <div className="onboarding">
          <div className="onboarding-content">
            <div className="onboarding-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            </div>
            <h1 className="onboarding-title">Weather</h1>
            <p className="onboarding-subtitle">Enter your location to get started</p>
            <div className="onboarding-search">
              <LocationSearch
                onLocationSelect={handleLocationSelect}
                placeholder="Search city or zip code..."
                usePortal={false}
              />
            </div>
            {loading && <p className="onboarding-loading">Loading forecast...</p>}
            {error && (
              <div className="onboarding-error">
                <p>{error}</p>
                <button className="retry-btn" onClick={retry}>Try Again</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main App (hidden during onboarding) */}
      {!isOnboarding && (
        <>
      {/* Offline Banner */}
      {(isOffline || debugErrorStates) && (
        <div className="offline-banner">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
            <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <line x1="12" y1="20" x2="12.01" y2="20" />
          </svg>
          <span>You're offline</span>
        </div>
      )}

      {/* Stale Data Banner */}
      {((isStale && !isOffline && !isRefreshing) || debugErrorStates) && forecast && (
        <div className="stale-banner">
          <span>Showing cached data</span>
          <button className="stale-refresh-btn" onClick={retry}>Refresh</button>
        </div>
      )}

      <main className="app-main">
        <div className="tab-content">
          {/* Show skeleton when loading without any data */}
          {loading && !forecast && <WeatherSkeleton />}

          {error && !forecast && (
            <div className="error-state">
              <p>{error}</p>
              <button className="retry-btn" onClick={retry}>Try Again</button>
            </div>
          )}

          {forecast && (
            <div className={`weather-content ${isRefreshing ? 'is-refreshing' : ''}`}>
              <UnifiedWeather
                hourly={forecast.hourly.slice(getCurrentHourIndex(forecast.hourly))}
                daily={forecast.daily}
                current={forecast.current}
                unit={tempUnit}
                iconStyle={iconStyle}
                locationName={selectedLocation ? `${selectedLocation.name}, ${selectedLocation.country}` : undefined}
                modelSpread={forecast.model_spread}
                selectedLocation={selectedLocation ?? undefined}
                recentLocations={recentLocations}
                quickSwitch={quickSwitch}
                onLocationSelect={handleLocationSelect}
                showRefresh={true}
                onRefresh={handleRefresh}
                onSettingsClick={showSettings ? undefined : () => setShowSettings(true)}
              />
            </div>
          )}

          {!forecast && !loading && !error && (
            <div className="empty-state">
              <p>Search for a location in Settings to see the weather</p>
            </div>
          )}
        </div>
      </main>

      {/* Settings Close Button */}
      {showSettings && (
        <button
          className="settings-close-btn"
          onClick={() => setShowSettings(false)}
          aria-label="Close settings"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}

      {/* Settings Overlay - lazy loaded */}
      {showSettings && (
        <Suspense fallback={<div className="settings-overlay"><div className="settings-overlay-content"><div className="loading-state">Loading...</div></div></div>}>
          <Settings
            selectedLocation={selectedLocation}
            recentLocations={recentLocations}
            rememberLocation={rememberLocation}
            showRecentLocations={showRecentLocations}
            quickSwitch={quickSwitch}
            autoRefreshInterval={autoRefreshInterval}
            onLocationSelect={handleLocationSelect}
            onRemoveRecentLocation={handleRemoveRecentLocation}
            onRememberLocationChange={setRememberLocation}
            onShowRecentLocationsChange={setShowRecentLocations}
            onQuickSwitchChange={setQuickSwitch}
            onAutoRefreshIntervalChange={setAutoRefreshInterval}
            tempUnit={tempUnit}
            onTempUnitChange={setTempUnit}
            theme={theme}
            onThemeChange={setTheme}
            iconStyle={iconStyle}
            onIconStyleChange={setIconStyle}
            forecast={forecast}
            onResetOnboarding={handleResetOnboarding}
            debugErrorStates={debugErrorStates}
            onDebugErrorStatesChange={setDebugErrorStates}
          />
        </Suspense>
      )}

        </>
      )}
    </div>
  );
}

export default App;
