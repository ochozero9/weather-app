import type { DailyForecast as DailyForecastType } from '../types/weather';
import type { TempUnit } from '../utils/weather';
import type { IconStyle } from './WeatherIcon';
import { convertTemp } from '../utils/weather';
import { WeatherIcon, UtilityIcon } from './WeatherIcon';
import { getWeatherDescription } from '../utils/weather';

interface DailyForecastProps {
  daily: DailyForecastType[];
  unit: TempUnit;
  iconStyle: IconStyle;
}

export function DailyForecast({ daily, unit, iconStyle }: DailyForecastProps) {
  const formatDay = (dateStr: string, index: number) => {
    if (index === 0) return 'Today';
    if (index === 1) return 'Tomorrow';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const getConfidenceClass = (confidence: number) => {
    if (confidence >= 75) return 'confidence-high';
    if (confidence >= 50) return 'confidence-mid-high';
    if (confidence >= 25) return 'confidence-mid-low';
    return 'confidence-low';
  };

  return (
    <div className="daily-forecast">
      <div className="daily-header">
        <h3>10-Day Forecast</h3>
      </div>
      <div className="daily-list">
        {daily.map((day, index) => {
          const description = getWeatherDescription(day.weather_code);
          return (
            <div key={index} className="daily-item">
              <div
                className={`confidence-circle ${getConfidenceClass(day.confidence)}`}
                title={`Forecast confidence: ${day.confidence}%`}
              />
              <span className="day-name">{formatDay(day.date, index)}</span>
              <div className="day-weather-group">
                <span className="day-icon" title={description}>
                  <WeatherIcon code={day.weather_code} style={iconStyle} size={28} />
                </span>
                <div className="day-temps">
                  <span className="temp-high">{Math.round(convertTemp(day.temperature_max, unit))}°</span>
                  <span className="temp-low">{Math.round(convertTemp(day.temperature_min, unit))}°</span>
                </div>
              </div>
              <span className="day-precip" title="Chance of rain">
                {day.precipitation_probability_max > 0 ? (
                  <>
                    <UtilityIcon type="humidity" style={iconStyle} size={14} />
                    <span>{day.precipitation_probability_max}%</span>
                  </>
                ) : (
                  <span className="no-precip">—</span>
                )}
              </span>
            </div>
          );
        })}
      </div>
      <div className="daily-legend">
        <span className="legend-label">Confidence:</span>
        <span className="legend-item">
          <span className="legend-dot confidence-high"></span> 75%+
        </span>
        <span className="legend-item">
          <span className="legend-dot confidence-mid-high"></span> 50%+
        </span>
        <span className="legend-item">
          <span className="legend-dot confidence-mid-low"></span> 25%+
        </span>
        <span className="legend-item">
          <span className="legend-dot confidence-low"></span> &lt;25%
        </span>
      </div>
    </div>
  );
}
