import { useState, lazy, Suspense } from 'react';
import { LocationSearch } from './LocationSearch';
import { WeatherIcon } from './WeatherIcon';
import { preloadModelComparison } from '../utils/preload';
import './Settings.css';

// Lazy load ModelComparison - only loaded when user clicks "Show Model Comparison"
const ModelComparison = lazy(() => import('./ModelComparison').then(m => ({ default: m.ModelComparison })));
import type { IconStyle } from './WeatherIcon';
import type { GeocodingResult, EnsembleForecast } from '../types/weather';
import type { TempUnit } from '../utils/weather';
import type { Theme } from '../utils/storage';

interface SettingsProps {
  // Location
  selectedLocation: GeocodingResult | null;
  recentLocations: GeocodingResult[];
  rememberLocation: boolean;
  showRecentLocations: boolean;
  quickSwitch: boolean;
  showRefreshButton: boolean;
  onLocationSelect: (location: GeocodingResult) => void;
  onRecentLocationSelect: (location: GeocodingResult) => void;
  onRemoveRecentLocation: (location: GeocodingResult, e: React.MouseEvent) => void;
  onRememberLocationChange: (value: boolean) => void;
  onShowRecentLocationsChange: (value: boolean) => void;
  onQuickSwitchChange: (value: boolean) => void;
  onShowRefreshButtonChange: (value: boolean) => void;
  // Temperature
  tempUnit: TempUnit;
  onTempUnitChange: (unit: TempUnit) => void;
  // Theme
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  // Icons
  iconStyle: IconStyle;
  onIconStyleChange: (style: IconStyle) => void;
  // Developer
  forecast: EnsembleForecast | null;
  onResetOnboarding: () => void;
}

export function Settings({
  selectedLocation,
  recentLocations,
  rememberLocation,
  showRecentLocations,
  quickSwitch,
  showRefreshButton,
  onLocationSelect,
  onRecentLocationSelect,
  onRemoveRecentLocation,
  onRememberLocationChange,
  onShowRecentLocationsChange,
  onQuickSwitchChange,
  onShowRefreshButtonChange,
  tempUnit,
  onTempUnitChange,
  theme,
  onThemeChange,
  iconStyle,
  onIconStyleChange,
  forecast,
  onResetOnboarding,
}: SettingsProps) {
  const [showModelComparison, setShowModelComparison] = useState(false);
  const [showDeveloperMenu, setShowDeveloperMenu] = useState(false);

  return (
    <div className="settings-overlay">
      <div className="settings-overlay-content">
        <h2 className="tab-title">Settings</h2>

        <div className="settings-section">
          <h3 className="settings-section-title">Location</h3>
          <LocationSearch
            onLocationSelect={onLocationSelect}
            initialValue={selectedLocation ? `${selectedLocation.name}, ${selectedLocation.country}` : ''}
          />
          {selectedLocation && (
            <p className="current-location">
              Current: {selectedLocation.name}, {selectedLocation.country}
            </p>
          )}

          <div className="settings-toggle-group">
            <label className="settings-toggle">
              <span className="settings-toggle-label">Remember location on launch</span>
              <button
                className={`toggle-switch ${rememberLocation ? 'active' : ''}`}
                onClick={() => onRememberLocationChange(!rememberLocation)}
                role="switch"
                aria-checked={rememberLocation}
              >
                <span className="toggle-switch-knob" />
              </button>
            </label>

            <label className="settings-toggle">
              <span className="settings-toggle-label">Save recent locations (up to 5)</span>
              <button
                className={`toggle-switch ${showRecentLocations ? 'active' : ''}`}
                onClick={() => onShowRecentLocationsChange(!showRecentLocations)}
                role="switch"
                aria-checked={showRecentLocations}
              >
                <span className="toggle-switch-knob" />
              </button>
            </label>

            <label className="settings-toggle">
              <span className="settings-toggle-label">Quick Location Switch</span>
              <button
                className={`toggle-switch ${quickSwitch ? 'active' : ''}`}
                onClick={() => onQuickSwitchChange(!quickSwitch)}
                role="switch"
                aria-checked={quickSwitch}
              >
                <span className="toggle-switch-knob" />
              </button>
            </label>

            <label className="settings-toggle">
              <span className="settings-toggle-label">Allow pull to refresh</span>
              <button
                className={`toggle-switch ${showRefreshButton ? 'active' : ''}`}
                onClick={() => onShowRefreshButtonChange(!showRefreshButton)}
                role="switch"
                aria-checked={showRefreshButton}
              >
                <span className="toggle-switch-knob" />
              </button>
            </label>
          </div>

          {showRecentLocations && recentLocations.length > 0 && (
            <div className="recent-locations-list">
              <p className="recent-locations-label">Recent locations:</p>
              <ul className="recent-locations">
                {recentLocations.map((loc) => (
                  <li
                    key={`${loc.latitude}-${loc.longitude}`}
                    className="recent-location-item"
                    onClick={() => onRecentLocationSelect(loc)}
                  >
                    <span className="recent-location-name">{loc.name}, {loc.country}</span>
                    <button
                      className="recent-location-remove"
                      onClick={(e) => onRemoveRecentLocation(loc, e)}
                      aria-label={`Remove ${loc.name}`}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="settings-section">
          <h3 className="settings-section-title">Temperature Unit</h3>
          <div className="settings-unit-toggle">
            <button
              className={`settings-unit-btn ${tempUnit === 'C' ? 'active' : ''}`}
              onClick={() => onTempUnitChange('C')}
            >
              <span className="unit-symbol">°C</span>
              <span className="unit-name">Celsius</span>
            </button>
            <button
              className={`settings-unit-btn ${tempUnit === 'F' ? 'active' : ''}`}
              onClick={() => onTempUnitChange('F')}
            >
              <span className="unit-symbol">°F</span>
              <span className="unit-name">Fahrenheit</span>
            </button>
          </div>
          <p className="settings-hint">Tip: Press C or F on your keyboard to switch units</p>
        </div>

        <div className="settings-section">
          <h3 className="settings-section-title">Theme</h3>
          <div className="settings-theme-options">
            <button
              className={`settings-theme-btn ${theme === 'default' ? 'active' : ''}`}
              onClick={() => onThemeChange('default')}
            >
              <span className="theme-preview theme-preview-default"></span>
              <span className="theme-name">Classic</span>
            </button>
            <button
              className={`settings-theme-btn ${theme === 'futuristic' ? 'active' : ''}`}
              onClick={() => onThemeChange('futuristic')}
            >
              <span className="theme-preview theme-preview-futuristic"></span>
              <span className="theme-name">Dark</span>
            </button>
            <button
              className={`settings-theme-btn ${theme === 'glass' ? 'active' : ''}`}
              onClick={() => onThemeChange('glass')}
            >
              <span className="theme-preview theme-preview-glass"></span>
              <span className="theme-name">Glass</span>
            </button>
            <button
              className={`settings-theme-btn ${theme === 'oled' ? 'active' : ''}`}
              onClick={() => onThemeChange('oled')}
            >
              <span className="theme-preview theme-preview-oled"></span>
              <span className="theme-name">OLED</span>
            </button>
          </div>
        </div>

        <div className="settings-section">
          <h3 className="settings-section-title">Icons</h3>
          <div className="settings-icon-options">
            <button
              className={`settings-icon-btn ${iconStyle === 'meteocons' ? 'active' : ''}`}
              onClick={() => onIconStyleChange('meteocons')}
            >
              <span className="icon-preview">
                <WeatherIcon code={0} style="meteocons" size={28} />
              </span>
              <span className="icon-style-name">Meteocons</span>
            </button>
            <button
              className={`settings-icon-btn ${iconStyle === 'filled' ? 'active' : ''}`}
              onClick={() => onIconStyleChange('filled')}
            >
              <span className="icon-preview">
                <WeatherIcon code={0} style="filled" size={28} />
              </span>
              <span className="icon-style-name">Filled</span>
            </button>
            <button
              className={`settings-icon-btn ${iconStyle === 'wiIcons' ? 'active' : ''}`}
              onClick={() => onIconStyleChange('wiIcons')}
            >
              <span className="icon-preview">
                <WeatherIcon code={0} style="wiIcons" size={28} />
              </span>
              <span className="icon-style-name">Classic</span>
            </button>
            <button
              className={`settings-icon-btn ${iconStyle === 'emoji' ? 'active' : ''}`}
              onClick={() => onIconStyleChange('emoji')}
            >
              <span className="icon-preview">
                <WeatherIcon code={0} style="emoji" size={28} />
              </span>
              <span className="icon-style-name">Emoji</span>
            </button>
          </div>
        </div>

        <div className="settings-section settings-section-developer">
          <button
            className="developer-menu-toggle"
            onClick={() => setShowDeveloperMenu(!showDeveloperMenu)}
          >
            <span className="developer-menu-title">Developer</span>
            <svg
              className={`developer-menu-arrow ${showDeveloperMenu ? 'open' : ''}`}
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {showDeveloperMenu && (
            <div className="developer-menu-content">
              {forecast && (
                <div className="developer-subsection">
                  <h4 className="developer-subsection-title">Model Details</h4>
                  <button
                    className="toggle-models-btn"
                    onClick={() => setShowModelComparison(!showModelComparison)}
                    onMouseEnter={preloadModelComparison}
                    onFocus={preloadModelComparison}
                  >
                    {showModelComparison ? 'Hide Model Comparison' : 'Show Model Comparison'}
                  </button>

                  {showModelComparison && (
                    <Suspense fallback={<div className="loading-state">Loading model data...</div>}>
                      <ModelComparison
                        latitude={forecast.location.latitude}
                        longitude={forecast.location.longitude}
                        unit={tempUnit}
                      />
                    </Suspense>
                  )}

                  <div className="model-spread">
                    <h4>Model Agreement</h4>
                    <div className="spread-metrics">
                      <div className="spread-item">
                        <span className="spread-label">Temperature spread</span>
                        <span className="spread-value">±{tempUnit === 'F' ? Math.round(forecast.model_spread.temperature * 1.8) : forecast.model_spread.temperature}°{tempUnit}</span>
                      </div>
                      <div className="spread-item">
                        <span className="spread-label">Precipitation spread</span>
                        <span className="spread-value">±{forecast.model_spread.precipitation} mm</span>
                      </div>
                      <div className="spread-item">
                        <span className="spread-label">Wind speed spread</span>
                        <span className="spread-value">±{forecast.model_spread.wind_speed} km/h</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="developer-subsection">
                <h4 className="developer-subsection-title">Debug</h4>
                <button
                  className="toggle-models-btn"
                  onClick={onResetOnboarding}
                  style={{ background: '#ef4444' }}
                >
                  Reset & Show Onboarding
                </button>
                <p className="settings-hint">Clears all saved locations and restarts the app</p>
              </div>

              <div className="developer-subsection">
                <h4 className="developer-subsection-title">Sources & Credits</h4>
                <div className="sources-list">
                  <div className="source-item">
                    <span className="source-category">Weather Data</span>
                    <a href="https://open-meteo.com" target="_blank" rel="noopener noreferrer">
                      Open-Meteo API
                    </a>
                    <span className="source-detail">Ensemble forecasting from 6 models: GFS, ECMWF, ICON, GEM, JMA, Meteo-France</span>
                  </div>
                  <div className="source-item">
                    <span className="source-category">Geocoding</span>
                    <a href="https://open-meteo.com/en/docs/geocoding-api" target="_blank" rel="noopener noreferrer">
                      Open-Meteo Geocoding
                    </a>
                    <span className="source-detail">Location search</span>
                  </div>
                  <div className="source-item">
                    <span className="source-category">Icons</span>
                    <a href="https://erikflowers.github.io/weather-icons/" target="_blank" rel="noopener noreferrer">
                      Weather Icons by Erik Flowers
                    </a>
                    <span className="source-detail">Classic icon set (via react-icons/wi)</span>
                  </div>
                  <div className="source-item">
                    <span className="source-category"></span>
                    <span className="source-inline">Custom SVG (Meteocons, Filled) &amp; System Emoji</span>
                  </div>
                  <div className="source-item">
                    <span className="source-category">Backend</span>
                    <span className="source-inline">Python + FastAPI</span>
                  </div>
                  <div className="source-item">
                    <span className="source-category">Frontend</span>
                    <span className="source-inline">React + TypeScript + Vite</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
