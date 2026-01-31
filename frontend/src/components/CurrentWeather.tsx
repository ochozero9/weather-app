import { memo } from 'react';
import type { CurrentWeather as CurrentWeatherType, HourlyForecast } from '../types/weather';
import type { TempUnit } from '../utils/weather';
import type { IconStyle } from './WeatherIcon';
import { convertTemp, getWeatherDescription } from '../utils/weather';
import { WeatherIcon } from './WeatherIcon';
import { isSnowCode, isRainCode, CONVERSIONS } from '../constants/weather';

interface CurrentWeatherProps {
  current: CurrentWeatherType;
  locationName?: string;
  unit: TempUnit;
  iconStyle: IconStyle;
  hourly?: HourlyForecast[];
}

export const CurrentWeather = memo(function CurrentWeather({ current, locationName, unit, iconStyle, hourly }: CurrentWeatherProps) {
  const weatherDescription = getWeatherDescription(current.weather_code);
  const now = new Date();
  const timeString = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  const temp = Math.round(convertTemp(current.temperature, unit));
  const feelsLike = Math.round(convertTemp(current.apparent_temperature, unit));

  // Calculate precipitation totals for next 24 hours
  let precipInfo = '';
  if (hourly && hourly.length > 0) {
    const next24Hours = hourly.slice(0, 24);
    const snowHours = next24Hours.filter(h => isSnowCode(h.weather_code));
    const rainHours = next24Hours.filter(h => isRainCode(h.weather_code));

    const snowPrecipMm = snowHours.reduce((sum, h) => sum + h.precipitation, 0);
    const rainPrecipMm = rainHours.reduce((sum, h) => sum + h.precipitation, 0);

    // Snow: convert to inches with 10:1 ratio
    const snowInches = snowPrecipMm * CONVERSIONS.SNOW_RATIO * CONVERSIONS.MM_TO_INCHES;
    // Rain: convert mm to inches
    const rainInches = rainPrecipMm * CONVERSIONS.MM_TO_INCHES;

    if (snowInches >= 0.1) {
      precipInfo = ` (${snowInches.toFixed(1)}" in next 24h)`;
    } else if (rainInches >= 0.01) {
      precipInfo = ` (${rainInches.toFixed(2)}" in next 24h)`;
    }
  }

  return (
    <div className="hero-weather">
      <div className="hero-main">
        <div className="hero-temp-group">
          <div className="hero-temp-row">
            <span className="hero-icon">
              <WeatherIcon code={current.weather_code} style={iconStyle} size={64} />
            </span>
            <div className="hero-temp">
              <span className="hero-temp-value">{temp}</span>
              <span className="hero-temp-unit">°{unit}</span>
            </div>
          </div>
          <span className="hero-feels-like">Feels like {feelsLike}°</span>
        </div>

        <div className="hero-info">
          {locationName && <h2 className="hero-location">{locationName}</h2>}
          <p className="hero-condition">{weatherDescription}{precipInfo && <span className="hero-precip-info">{precipInfo}</span>}</p>
          <p className="hero-time">Updated {timeString}</p>
        </div>
      </div>

    </div>
  );
});
