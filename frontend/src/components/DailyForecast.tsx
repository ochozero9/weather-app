import { memo } from 'react';
import type { DailyForecast as DailyForecastType } from '../types/weather';
import type { TempUnit } from '../utils/weather';
import type { IconStyle } from './WeatherIcon';
import { convertTemp } from '../utils/weather';
import { WeatherIcon } from './WeatherIcon';
import { getWeatherDescription } from '../utils/weather';

interface DailyForecastProps {
  daily: DailyForecastType[];
  unit: TempUnit;
  iconStyle: IconStyle;
}

interface DailyItemProps {
  day: DailyForecastType;
  unit: TempUnit;
  iconStyle: IconStyle;
}

const getConfidenceClass = (confidence: number) => {
  if (confidence >= 75) return 'confidence-high';
  if (confidence >= 50) return 'confidence-mid-high';
  if (confidence >= 25) return 'confidence-mid-low';
  return 'confidence-low';
};

const formatDay = (dateStr: string) => {
  const date = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dateOnly = new Date(date);
  dateOnly.setHours(0, 0, 0, 0);

  if (dateOnly.getTime() === today.getTime()) return 'Today';
  if (dateOnly.getTime() === tomorrow.getTime()) return 'Tomorrow';
  return date.toLocaleDateString('en-US', { weekday: 'short' });
};

const DailyItem = memo(function DailyItem({ day, unit, iconStyle }: DailyItemProps) {
  const description = getWeatherDescription(day.weather_code);
  return (
    <div className="daily-item">
      <div
        className={`confidence-circle ${getConfidenceClass(day.confidence)}`}
        title={`Forecast confidence: ${day.confidence}%`}
      />
      <span className="day-name">{formatDay(day.date)}</span>
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
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
            </svg>
            <span>{day.precipitation_probability_max}%</span>
          </>
        ) : (
          <span className="no-precip">—</span>
        )}
      </span>
    </div>
  );
});

export const DailyForecast = memo(function DailyForecast({ daily, unit, iconStyle }: DailyForecastProps) {
  return (
    <div className="daily-forecast">
      <div className="daily-header">
        <h3>10-Day Forecast</h3>
      </div>
      <div className="daily-list">
        {daily.map((day) => (
          <DailyItem key={day.date} day={day} unit={unit} iconStyle={iconStyle} />
        ))}
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
});
