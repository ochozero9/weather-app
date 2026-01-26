import { useState, useEffect } from 'react';
import type { HourlyForecast, DailyForecast as DailyForecastType, CurrentWeather as CurrentWeatherType, GeocodingResult } from '../types/weather';
import type { TempUnit } from '../utils/weather';
import type { IconStyle } from './WeatherIcon';
import { convertTemp } from '../utils/weather';
import { preloadSettings } from '../utils/preload';
import { WeatherIcon, UtilityIcon } from './WeatherIcon';
import { getWeatherDescription } from '../utils/weather';
import { AccuracyBadge } from './AccuracyBadge';
import { TimelineDial } from './TimelineDial';
import { CurrentWeather } from './CurrentWeather';
import { LocationSelector } from './LocationSelector';
import { HourlyGraph } from './HourlyGraph';
import { DailyForecast } from './DailyForecast';

interface UnifiedWeatherProps {
  hourly: HourlyForecast[];
  daily: DailyForecastType[];
  current: CurrentWeatherType;
  unit: TempUnit;
  iconStyle: IconStyle;
  locationName?: string;
  modelSpread?: {
    temperature: number;
    precipitation: number;
    wind_speed: number;
  };
  // Location switching
  selectedLocation?: GeocodingResult;
  recentLocations?: GeocodingResult[];
  quickSwitch?: boolean;
  onLocationSelect?: (location: GeocodingResult) => void;
  // Refresh
  showRefresh?: boolean;
  onRefresh?: () => void;
  // Settings
  onSettingsClick?: () => void;
}

export function UnifiedWeather({
  hourly, daily, current, unit, iconStyle, locationName, modelSpread,
  selectedLocation, recentLocations, quickSwitch, onLocationSelect,
  showRefresh, onRefresh, onSettingsClick
}: UnifiedWeatherProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showCard, setShowCard] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  const hours = hourly.slice(0, 48);
  const selectedHour = hours[selectedIndex];
  const isNow = selectedIndex === 0;

  // Handle card animation
  useEffect(() => {
    if (!isNow && !showCard) {
      // Show card with enter animation
      setShowCard(true);
      setIsAnimatingOut(false);
    } else if (isNow && showCard) {
      // Start exit animation
      setIsAnimatingOut(true);
      const timer = setTimeout(() => {
        setShowCard(false);
        setIsAnimatingOut(false);
      }, 150); // Match animation duration
      return () => clearTimeout(timer);
    }
  }, [isNow, showCard]);

  const getDailyForHour = (timeStr: string) => {
    const hourDate = new Date(timeStr).toISOString().split('T')[0];
    return daily.find(d => d.date.split('T')[0] === hourDate);
  };

  const formatSunTime = (isoStr?: string) => {
    if (!isoStr) return '—';
    const date = new Date(isoStr);
    const hour = date.getHours();
    const min = date.getMinutes();
    const ampm = hour >= 12 ? 'p' : 'a';
    const h = hour % 12 || 12;
    return `${h}:${min.toString().padStart(2, '0')}${ampm}`;
  };

  const calculateFeelsLike = (temp: number, humidity: number, windSpeed: number) => {
    if (temp <= 10) return temp - (windSpeed * 0.3);
    if (temp >= 27) return temp + (humidity * 0.05);
    return temp;
  };

  if (!selectedHour) return null;

  // Selected hour data for forecast card
  const selectedTemp = Math.round(convertTemp(selectedHour.temperature, unit));
  const selectedFeelsLike = Math.round(convertTemp(
    calculateFeelsLike(selectedHour.temperature, selectedHour.humidity, selectedHour.wind_speed),
    unit
  ));
  const selectedWeatherCode = selectedHour.weather_code;
  const selectedDaily = getDailyForHour(selectedHour.time);

  // Format selected time
  const getSelectedTimeDisplay = () => {
    const date = new Date(selectedHour.time);
    const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
    const dayStr = date.toLocaleDateString('en-US', { weekday: 'short' });
    return `${dayStr} ${timeStr}`;
  };

  // Show location selector if quick switch is enabled and there are multiple locations
  const showLocationSelector = selectedLocation && quickSwitch && recentLocations && recentLocations.length > 1 && onLocationSelect;

  return (
    <div className="unified-weather">
      {/* Header Row: Title, Location, Settings */}
      <div className="unified-header">
        <span className="section-title-inline">Now</span>
        {showLocationSelector ? (
          <LocationSelector
            selectedLocation={selectedLocation}
            recentLocations={recentLocations}
            onLocationSelect={onLocationSelect}
          />
        ) : (
          <span className="header-location-name">{locationName}</span>
        )}
        {onSettingsClick && (
          <button
            className="settings-menu-btn header-settings-btn"
            onClick={onSettingsClick}
            onMouseEnter={preloadSettings}
            onFocus={preloadSettings}
            aria-label="Open settings"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        )}
      </div>

      {/* Hero Section - reuses CurrentWeather component */}
      <CurrentWeather
        current={current}
        unit={unit}
        iconStyle={iconStyle}
        hourly={hourly}
      />

      {/* Sunrise/Sunset row */}
      <div className="sun-times-row">
        <div className="sun-time-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 18a5 5 0 0 0-10 0" />
            <line x1="12" y1="9" x2="12" y2="2" />
            <line x1="4.22" y1="10.22" x2="5.64" y2="11.64" />
            <line x1="1" y1="18" x2="3" y2="18" />
            <line x1="21" y1="18" x2="23" y2="18" />
            <line x1="18.36" y1="11.64" x2="19.78" y2="10.22" />
          </svg>
          <span>{formatSunTime(selectedDaily?.sunrise)}</span>
        </div>
        <div className="sun-time-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 18a5 5 0 0 0-10 0" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="13" x2="12" y2="17" strokeLinecap="round" strokeDasharray="2 2" />
            <line x1="4.22" y1="10.22" x2="5.64" y2="11.64" />
            <line x1="1" y1="18" x2="3" y2="18" />
            <line x1="21" y1="18" x2="23" y2="18" />
            <line x1="18.36" y1="11.64" x2="19.78" y2="10.22" />
          </svg>
          <span>{formatSunTime(selectedDaily?.sunset)}</span>
        </div>
      </div>

      {/* Secondary data */}
      <div className="secondary-data">
        <div className="secondary-data-grid">
          <div className="secondary-data-item">
            <span className="secondary-data-icon">
              <UtilityIcon type="humidity" style={iconStyle} size={20} />
            </span>
            <div className="secondary-data-info">
              <span className="secondary-data-value">{current.humidity}%</span>
              <span className="secondary-data-label">Humidity</span>
            </div>
          </div>
          <div className="secondary-data-item">
            <span className="secondary-data-icon">
              <UtilityIcon type="air-quality" style={iconStyle} size={20} />
            </span>
            <div className="secondary-data-info">
              <span className="secondary-data-value">
                {current.aqi !== undefined && current.aqi !== null ? current.aqi : '--'}
              </span>
              <span className="secondary-data-label">Air Quality</span>
            </div>
          </div>
          <div className="secondary-data-item">
            <span className="secondary-data-icon">
              <UtilityIcon type="uv" style={iconStyle} size={20} />
            </span>
            <div className="secondary-data-info">
              <span className="secondary-data-value">
                {current.uv_index !== undefined ? current.uv_index.toFixed(0) : '--'}
              </span>
              <span className="secondary-data-label">UV Index</span>
            </div>
          </div>
          <div className="secondary-data-item">
            <span className="secondary-data-icon">
              <UtilityIcon type="visibility" style={iconStyle} size={20} />
            </span>
            <div className="secondary-data-info">
              <span className="secondary-data-value">
                {current.visibility !== undefined ? `${(current.visibility / 1609.34).toFixed(1)} mi` : '--'}
              </span>
              <span className="secondary-data-label">Visibility</span>
            </div>
          </div>
        </div>
      </div>

      {/* Then section - Hourly graph */}
      <h3 className="section-title">Then</h3>
      <section className="hourly-graph-section">
        <HourlyGraph
          hourly={hourly}
          unit={unit}
        />
      </section>

      {/* Later section - 7-day forecast */}
      <h3 className="section-title">Later</h3>
      <section className="forecast-section">
        <DailyForecast daily={daily} unit={unit} iconStyle={iconStyle} />
      </section>

      {/* Confidence Badge */}
      <AccuracyBadge
        modelSpread={modelSpread}
        dailyConfidence={daily.map(d => d.confidence)}
        showRefresh={showRefresh}
        onRefresh={onRefresh}
      />

      {/* Forecast info - above scrubber when not at Now */}
      {showCard && (
        <div className={`forecast-card-floating ${isAnimatingOut ? 'exiting' : ''}`}>
          <div className="forecast-card-header">
            <span className="forecast-card-time">{getSelectedTimeDisplay()}</span>
          </div>
          <div className="forecast-card-main">
            <span className="forecast-card-icon">
              <WeatherIcon code={selectedWeatherCode} style={iconStyle} size={36} />
            </span>
            <div className="forecast-card-temp">
              <span className="forecast-card-temp-value">{selectedTemp}°</span>
              <span className="forecast-card-feels">Feels {selectedFeelsLike}°</span>
            </div>
            <span className="forecast-card-condition">{getWeatherDescription(selectedWeatherCode)}</span>
          </div>
          <div className="forecast-card-details">
            <div className="forecast-card-detail">
              <UtilityIcon type="humidity" style={iconStyle} size={14} />
              <span>{selectedHour.humidity}%</span>
            </div>
            <div className="forecast-card-detail">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" />
              </svg>
              <span>{Math.round(selectedHour.wind_speed)} km/h</span>
            </div>
            <div className="forecast-card-detail">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
              </svg>
              <span>{selectedHour.precipitation_probability}%</span>
            </div>
            <div className="forecast-card-detail">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
              </svg>
              <span>{selectedHour.cloud_cover}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Back to Now button - left of scrubber */}
      {selectedIndex >= 3 && (
        <button
          className="back-to-now-btn"
          onClick={() => setSelectedIndex(0)}
          aria-label="Back to now"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      )}

      {/* Timeline Dial */}
      <TimelineDial
        hours={hours}
        selectedIndex={selectedIndex}
        onIndexChange={setSelectedIndex}
        showNowLabel={true}
      />
    </div>
  );
}
