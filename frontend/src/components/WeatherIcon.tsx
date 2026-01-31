import React from 'react';
import { WEATHER_CODES } from '../constants/weather';
import {
  WiDaySunny,
  WiNightClear,
  WiDayCloudy,
  WiNightAltCloudy,
  WiCloudy,
  WiFog,
  WiSprinkle,
  WiRain,
  WiSleet,
  WiThunderstorm,
  WiNa,
  WiDayShowers,
  WiNightAltShowers,
  WiDaySnow,
  WiNightAltSnow,
} from 'react-icons/wi';

export type IconStyle = 'emoji' | 'meteocons' | 'wiIcons' | 'filled';

interface WeatherIconProps {
  code: number;
  style: IconStyle;
  size?: number;
  className?: string;
  time?: string; // ISO string to determine day/night
}

interface UtilityIconProps {
  type: 'humidity' | 'air-quality' | 'uv' | 'visibility' | 'rain' | 'snow' | 'wind';
  style: IconStyle;
  size?: number;
  className?: string;
}

// Simple day/night detection based on hour (can be enhanced with actual sunrise/sunset)
function isNightTime(time?: string): boolean {
  const date = time ? new Date(time) : new Date();
  const hour = date.getHours();
  // Consider night between 7 PM and 6 AM
  return hour >= 19 || hour < 6;
}

// Utility icons for secondary data
const UtilityIcons: Record<string, React.ReactNode> = {
  'humidity': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
      <path d="M12 13v4" opacity="0.5" />
      <circle cx="12" cy="18" r="1" fill="currentColor" opacity="0.5" />
    </svg>
  ),
  'air-quality': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 12h.01M12 12h.01M16 12h.01" />
      <path d="M3 12a5 5 0 0 1 5-5h3a5 5 0 0 1 5 5" />
      <path d="M5 16a3 3 0 0 1 3-3h2a3 3 0 0 1 3 3" />
      <path d="M6 20a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2" />
      <circle cx="18" cy="8" r="3" />
    </svg>
  ),
  'uv': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      <path d="M12 8v4l2 2" strokeWidth="1" />
    </svg>
  ),
  'visibility': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  'rain': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 13a4 4 0 0 0-4-4h-.5a5 5 0 0 0-9.27 2A4 4 0 0 0 4 17h12a4 4 0 0 0 0-8z" />
      <path d="M8 19v2M12 19v2M16 19v2" />
    </svg>
  ),
  'snow': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20M2 12h20" />
      <path d="M12 2l4 4M12 2l-4 4M12 22l4-4M12 22l-4-4M2 12l4 4M2 12l4-4M22 12l-4 4M22 12l-4-4" />
    </svg>
  ),
  'wind': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.59 4.59A2 2 0 1 1 11 8H2" />
      <path d="M12.59 19.41A2 2 0 1 0 14 16H2" />
      <path d="M17.73 7.73A2.5 2.5 0 1 1 19.5 12H2" />
    </svg>
  ),
};

// Utility icons emoji fallback
const UtilityEmojis: Record<string, string> = {
  'humidity': '💧',
  'air-quality': '🌬️',
  'uv': '☀️',
  'visibility': '👁️',
  'rain': '🌧️',
  'snow': '❄️',
  'wind': '💨',
};

// Erik Flowers Weather Icons mapping (react-icons/wi)
function getWiIcon(code: number, isNight: boolean, size: number): React.ReactNode {
  const iconProps = { size, className: 'wi-icon' };

  if (code === 0) return isNight ? <WiNightClear {...iconProps} /> : <WiDaySunny {...iconProps} />;
  if (code === 1 || code === 2) return isNight ? <WiNightAltCloudy {...iconProps} /> : <WiDayCloudy {...iconProps} />;
  if (code === 3) return <WiCloudy {...iconProps} />;
  if (code === 45 || code === 48) return <WiFog {...iconProps} />;
  if (code >= 51 && code <= 55) return <WiSprinkle {...iconProps} />;
  if (code >= 61 && code <= 65) return <WiRain {...iconProps} />;
  if (code === 66 || code === 67) return <WiSleet {...iconProps} />;
  if (code >= 71 && code <= 77) return isNight ? <WiNightAltSnow {...iconProps} /> : <WiDaySnow {...iconProps} />;
  if (code >= 80 && code <= 82) return isNight ? <WiNightAltShowers {...iconProps} /> : <WiDayShowers {...iconProps} />;
  if (code === 85 || code === 86) return isNight ? <WiNightAltSnow {...iconProps} /> : <WiDaySnow {...iconProps} />;
  if (code >= 95 && code <= 99) return <WiThunderstorm {...iconProps} />;
  return <WiNa {...iconProps} />;
}

// Meteocons-style icons (Bas Milius inspired - colorful animated SVGs)
const MeteoconIcons: Record<string, React.ReactNode> = {
  'clear': (
    <svg viewBox="0 0 24 24">
      <defs>
        <linearGradient id="sunGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="5" fill="url(#sunGrad)" />
      <g stroke="#fbbf24" strokeWidth="2" strokeLinecap="round">
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </g>
    </svg>
  ),
  'clear-night': (
    <svg viewBox="0 0 24 24">
      <defs>
        <linearGradient id="moonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="100%" stopColor="#fcd34d" />
        </linearGradient>
      </defs>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="url(#moonGrad)" />
    </svg>
  ),
  'partly-cloudy': (
    <svg viewBox="0 0 24 24">
      <defs>
        <linearGradient id="sunGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
        <linearGradient id="cloudGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f1f5f9" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>
      </defs>
      <circle cx="8" cy="8" r="4" fill="url(#sunGrad2)" />
      <path d="M18 18H8a4 4 0 0 1-.5-7.96A5 5 0 0 1 17 11a3.5 3.5 0 0 1 1 7z" fill="url(#cloudGrad)" />
    </svg>
  ),
  'cloudy': (
    <svg viewBox="0 0 24 24">
      <defs>
        <linearGradient id="cloudGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#e2e8f0" />
          <stop offset="100%" stopColor="#94a3b8" />
        </linearGradient>
      </defs>
      <path d="M18 18H6a5 5 0 0 1-.5-9.96A7 7 0 0 1 18.5 10 4.5 4.5 0 0 1 18 18z" fill="url(#cloudGrad2)" />
    </svg>
  ),
  'fog': (
    <svg viewBox="0 0 24 24">
      <g stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
        <line x1="3" y1="8" x2="21" y2="8" opacity="0.4" />
        <line x1="3" y1="12" x2="21" y2="12" opacity="0.6" />
        <line x1="5" y1="16" x2="19" y2="16" opacity="0.8" />
        <line x1="7" y1="20" x2="17" y2="20" />
      </g>
    </svg>
  ),
  'rain': (
    <svg viewBox="0 0 24 24">
      <defs>
        <linearGradient id="rainCloud" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
      </defs>
      <path d="M16 13a4 4 0 0 0-4-4h-.5a5 5 0 0 0-9.27 2A4 4 0 0 0 4 17h12a4 4 0 0 0 0-8z" fill="url(#rainCloud)" />
      <g stroke="#3b82f6" strokeWidth="2" strokeLinecap="round">
        <line x1="8" y1="19" x2="8" y2="22" />
        <line x1="12" y1="19" x2="12" y2="22" />
        <line x1="16" y1="19" x2="16" y2="22" />
      </g>
    </svg>
  ),
  'snow': (
    <svg viewBox="0 0 24 24">
      <defs>
        <linearGradient id="snowCloud" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#e2e8f0" />
          <stop offset="100%" stopColor="#94a3b8" />
        </linearGradient>
      </defs>
      <path d="M16 13a4 4 0 0 0-4-4h-.5a5 5 0 0 0-9.27 2A4 4 0 0 0 4 17h12a4 4 0 0 0 0-8z" fill="url(#snowCloud)" />
      <g fill="#60a5fa">
        <circle cx="8" cy="20" r="1.5" />
        <circle cx="12" cy="20" r="1.5" />
        <circle cx="16" cy="20" r="1.5" />
      </g>
    </svg>
  ),
  'thunderstorm': (
    <svg viewBox="0 0 24 24">
      <defs>
        <linearGradient id="stormCloud" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#64748b" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>
      </defs>
      <path d="M16 13a4 4 0 0 0-4-4h-.5a5 5 0 0 0-9.27 2A4 4 0 0 0 4 17h12a4 4 0 0 0 0-8z" fill="url(#stormCloud)" />
      <path d="M13 17l-2 4h3l-2 4" fill="#fbbf24" stroke="#f59e0b" strokeWidth="0.5" />
    </svg>
  ),
  'drizzle': (
    <svg viewBox="0 0 24 24">
      <defs>
        <linearGradient id="drizzleCloud" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#94a3b8" />
        </linearGradient>
      </defs>
      <path d="M16 13a4 4 0 0 0-4-4h-.5a5 5 0 0 0-9.27 2A4 4 0 0 0 4 17h12a4 4 0 0 0 0-8z" fill="url(#drizzleCloud)" />
      <g fill="#60a5fa">
        <circle cx="8" cy="20" r="1" />
        <circle cx="12" cy="20" r="1" />
        <circle cx="16" cy="20" r="1" />
      </g>
    </svg>
  ),
};

// Filled style icons (solid colorful)
const FilledIcons: Record<string, React.ReactNode> = {
  'clear': (
    <svg viewBox="0 0 24 24" fill="#fbbf24">
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  'clear-night': (
    <svg viewBox="0 0 24 24" fill="#fcd34d">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ),
  'partly-cloudy': (
    <svg viewBox="0 0 24 24">
      <circle cx="8" cy="8" r="4" fill="#fbbf24" />
      <path d="M18 18H8a4 4 0 0 1-.5-7.96A5 5 0 0 1 17 11a3.5 3.5 0 0 1 1 7z" fill="#94a3b8" />
    </svg>
  ),
  'cloudy': (
    <svg viewBox="0 0 24 24" fill="#94a3b8">
      <path d="M18 18H6a5 5 0 0 1-.5-9.96A7 7 0 0 1 18.5 10 4.5 4.5 0 0 1 18 18z" />
    </svg>
  ),
  'fog': (
    <svg viewBox="0 0 24 24" fill="#94a3b8">
      <rect x="3" y="7" width="18" height="2" rx="1" opacity="0.4" />
      <rect x="3" y="11" width="18" height="2" rx="1" opacity="0.6" />
      <rect x="5" y="15" width="14" height="2" rx="1" opacity="0.8" />
      <rect x="7" y="19" width="10" height="2" rx="1" />
    </svg>
  ),
  'rain': (
    <svg viewBox="0 0 24 24">
      <path d="M16 13a4 4 0 0 0-4-4h-.5a5 5 0 0 0-9.27 2A4 4 0 0 0 4 17h12a4 4 0 0 0 0-8z" fill="#64748b" />
      <path d="M8 19v3M12 19v3M16 19v3" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  'snow': (
    <svg viewBox="0 0 24 24">
      <path d="M16 13a4 4 0 0 0-4-4h-.5a5 5 0 0 0-9.27 2A4 4 0 0 0 4 17h12a4 4 0 0 0 0-8z" fill="#94a3b8" />
      <circle cx="8" cy="20" r="2" fill="#60a5fa" />
      <circle cx="12" cy="20" r="2" fill="#60a5fa" />
      <circle cx="16" cy="20" r="2" fill="#60a5fa" />
    </svg>
  ),
  'thunderstorm': (
    <svg viewBox="0 0 24 24">
      <path d="M16 13a4 4 0 0 0-4-4h-.5a5 5 0 0 0-9.27 2A4 4 0 0 0 4 17h12a4 4 0 0 0 0-8z" fill="#475569" />
      <path d="M13 17l-2 4h3l-2 4" fill="#fbbf24" />
    </svg>
  ),
  'drizzle': (
    <svg viewBox="0 0 24 24">
      <path d="M16 13a4 4 0 0 0-4-4h-.5a5 5 0 0 0-9.27 2A4 4 0 0 0 4 17h12a4 4 0 0 0 0-8z" fill="#94a3b8" />
      <circle cx="8" cy="20" r="1.5" fill="#60a5fa" />
      <circle cx="12" cy="20" r="1.5" fill="#60a5fa" />
      <circle cx="16" cy="20" r="1.5" fill="#60a5fa" />
    </svg>
  ),
};

// Get meteocon or filled icon
function getColoredIcon(code: number, isNight: boolean, iconSet: Record<string, React.ReactNode>): React.ReactNode {
  if (code === 0) return iconSet[isNight ? 'clear-night' : 'clear'] || iconSet['clear'];
  if (code === 1 || code === 2) return iconSet['partly-cloudy'];
  if (code === 3) return iconSet['cloudy'];
  if (code === 45 || code === 48) return iconSet['fog'];
  if (code >= 51 && code <= 55) return iconSet['drizzle'];
  if (code >= 61 && code <= 67) return iconSet['rain'];
  if (code >= 71 && code <= 77) return iconSet['snow'];
  if (code >= 80 && code <= 82) return iconSet['rain'];
  if (code === 85 || code === 86) return iconSet['snow'];
  if (code >= 95 && code <= 99) return iconSet['thunderstorm'];
  return iconSet['cloudy'];
}

export function WeatherIcon({ code, style, size = 24, className = '', time }: WeatherIconProps) {
  const isNight = isNightTime(time);

  // Emoji style
  if (style === 'emoji') {
    if (isNight && (code === 0 || code === 1)) {
      return (
        <span className={`weather-icon weather-icon-emoji ${className}`} style={{ fontSize: size }}>
          🌙
        </span>
      );
    }
    const weatherInfo = WEATHER_CODES[code] || { icon: '❓' };
    return (
      <span className={`weather-icon weather-icon-emoji ${className}`} style={{ fontSize: size }}>
        {weatherInfo.icon}
      </span>
    );
  }

  // Erik Flowers Weather Icons (wiIcons)
  if (style === 'wiIcons') {
    return (
      <span className={`weather-icon weather-icon-wi ${className}`} style={{ display: 'inline-flex' }}>
        {getWiIcon(code, isNight, size)}
      </span>
    );
  }

  // Meteocons (Bas Milius inspired)
  if (style === 'meteocons') {
    const icon = getColoredIcon(code, isNight, MeteoconIcons);
    return (
      <span
        className={`weather-icon weather-icon-meteocons ${className}`}
        style={{ width: size, height: size, display: 'inline-flex' }}
      >
        {icon}
      </span>
    );
  }

  // Default: Filled colorful icons
  const icon = getColoredIcon(code, isNight, FilledIcons);
  return (
    <span
      className={`weather-icon weather-icon-filled ${className}`}
      style={{ width: size, height: size, display: 'inline-flex' }}
    >
      {icon}
    </span>
  );
}

export function UtilityIcon({ type, style, size = 24, className = '' }: UtilityIconProps) {
  if (style === 'emoji') {
    return (
      <span className={`weather-icon weather-icon-emoji ${className}`} style={{ fontSize: size }}>
        {UtilityEmojis[type] || '❓'}
      </span>
    );
  }

  // All other styles use the utility SVG icons
  const icon = UtilityIcons[type] || UtilityIcons['humidity'];
  const styleClass = style === 'wiIcons' ? 'weather-icon-wi' :
                     style === 'meteocons' ? 'weather-icon-meteocons' : 'weather-icon-filled';

  return (
    <span
      className={`weather-icon ${styleClass} ${className}`}
      style={{ width: size, height: size, display: 'inline-flex' }}
    >
      {icon}
    </span>
  );
}
