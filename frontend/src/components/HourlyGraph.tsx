/**
 * HourlyGraph Component
 * =====================
 * Renders a horizontally scrollable SVG chart showing hourly weather data.
 *
 * Layout Structure:
 * ┌─────────────────────────────────────────────────┐
 * │ Y-axis │         Chart Area (scrollable)        │
 * │ labels │  - Temperature line (smooth curve)     │
 * │        │  - Wind line + direction arrows        │
 * │        │  - High/low point labels               │
 * ├────────┼─────────────────────────────────────────┤
 * │        │  Precipitation/Snow bars               │
 * └────────┴─────────────────────────────────────────┘
 * │        │  Time labels (hours)                   │
 *
 * Key Design Decisions:
 * - Fixed width per hour (60px) for consistent scrolling
 * - SVG width grows with data, container scrolls horizontally
 * - Uses bezier curves for smooth temperature/wind lines
 * - Precipitation uses bar chart at bottom (separate from line chart)
 * - Snow is converted to inches using 10:1 snow ratio
 *
 * Performance:
 * - useMemo for data calculations (avoids recalc on every render)
 * - Hooks rules: early return MUST be after all hooks
 */

import { useState, useMemo } from 'react';
import type { HourlyForecast } from '../types/weather';
import type { TempUnit } from '../utils/weather';
import { convertTemp } from '../utils/weather';
import { isSnowCode, CONVERSIONS } from '../constants/weather';

type DataLayer = 'temp' | 'precip' | 'snow' | 'wind';
type HourOption = 6 | 12 | 24;

interface HourlyGraphProps {
  hourly: HourlyForecast[];
  unit: TempUnit;
  hoursToShow?: number;
}

export function HourlyGraph({ hourly, unit, hoursToShow: externalHours }: HourlyGraphProps) {
  const [activeLayers, setActiveLayers] = useState<Set<DataLayer>>(new Set(['temp', 'precip', 'snow', 'wind']));
  const [internalHours, setInternalHours] = useState<HourOption>(12);
  const hoursToShow = externalHours ?? internalHours;
  const displayHours = hourly.slice(0, hoursToShow);

  const toggleLayer = (layer: DataLayer) => {
    setActiveLayers(prev => {
      const next = new Set(prev);
      if (next.has(layer)) {
        if (next.size > 1) next.delete(layer);
      } else {
        next.add(layer);
      }
      return next;
    });
  };

  // Graph dimensions - fixed width per hour for scrollable layout
  const graphHeight = 160;
  const barAreaHeight = 40;
  const totalHeight = graphHeight + barAreaHeight;
  const padding = { top: 24, right: 16, bottom: 24, left: 40 };
  const hourWidth = 60; // Width per hour - determines scroll
  const svgWidth = padding.left + padding.right + (displayHours.length) * hourWidth;
  const chartHeight = graphHeight - padding.top - padding.bottom;

  // Calculate data ranges
  const { temps, minTemp, maxTemp, maxWind, maxPrecip, maxSnow, snowData } = useMemo(() => {
    const temps = displayHours.map(h => convertTemp(h.temperature, unit));
    const minT = Math.floor(Math.min(...temps) - 3);
    const maxT = Math.ceil(Math.max(...temps) + 3);
    const maxW = Math.max(...displayHours.map(h => h.wind_speed), 15);

    const snowData = displayHours.map(h => {
      if (isSnowCode(h.weather_code)) {
        return h.precipitation * CONVERSIONS.SNOW_RATIO * CONVERSIONS.MM_TO_INCHES;
      }
      return 0;
    });

    const maxP = Math.max(...displayHours.map(h =>
      isSnowCode(h.weather_code) ? 0 : h.precipitation
    ), 1);
    const maxS = Math.max(...snowData, 0.5);

    return { temps, minTemp: minT, maxTemp: maxT, maxWind: maxW, maxPrecip: maxP, maxSnow: maxS, snowData };
  }, [displayHours, unit]);

  // ========== SVG SCALE FUNCTIONS ==========
  // These convert data values to SVG pixel coordinates
  //
  // X-axis: Simple linear scale, each hour gets `hourWidth` pixels
  const xPos = (index: number) => padding.left + (index * hourWidth);

  // Y-axis: Maps data values to vertical position
  // SVG Y increases downward, so we subtract from chartHeight to flip
  // Formula: y = top + height - ((value - min) / range) * height
  //
  // Protection against division-by-zero when all values are identical
  const tempRange = maxTemp - minTemp || 1;  // fallback to 1 if flat line
  const tempY = (temp: number) => padding.top + chartHeight - ((temp - minTemp) / tempRange) * chartHeight;
  const windY = (wind: number) => padding.top + chartHeight - (wind / (maxWind || 1)) * chartHeight;

  // Format hour label
  const formatHour = (dateStr: string, index: number) => {
    const date = new Date(dateStr);
    const hour = date.getHours();
    const ampm = hour >= 12 ? 'p' : 'a';
    const h = hour % 12 || 12;

    if (hour === 0 || index === 0) {
      return {
        time: `${h}${ampm}`,
        day: date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }).toUpperCase()
      };
    }
    return { time: `${h}${ampm}`, day: null };
  };

  // Find high/low points for labels
  const highLowPoints = useMemo(() => {
    if (temps.length < 2) return [];

    const points: { index: number; isHigh: boolean; temp: number }[] = [];
    points.push({ index: 0, isHigh: temps[0] >= temps[1], temp: temps[0] });

    for (let i = 1; i < temps.length - 1; i++) {
      const prev = temps[i - 1];
      const curr = temps[i];
      const next = temps[i + 1];

      if (curr > prev && curr > next) {
        points.push({ index: i, isHigh: true, temp: curr });
      } else if (curr < prev && curr < next) {
        points.push({ index: i, isHigh: false, temp: curr });
      }
    }

    points.push({
      index: temps.length - 1,
      isHigh: temps[temps.length - 1] >= temps[temps.length - 2],
      temp: temps[temps.length - 1]
    });

    return points;
  }, [temps]);

  // Find peak wind points for labels
  const windPeakPoints = useMemo(() => {
    const winds = displayHours.map(h => h.wind_speed);
    if (winds.length < 2) return [];

    const points: { index: number; speed: number }[] = [];

    for (let i = 1; i < winds.length - 1; i++) {
      const prev = winds[i - 1];
      const curr = winds[i];
      const next = winds[i + 1];

      if (curr > prev && curr >= next && curr > 5) {
        points.push({ index: i, speed: curr });
      }
    }

    // Add first/last if significant
    if (winds[0] > 10) points.unshift({ index: 0, speed: winds[0] });
    if (winds[winds.length - 1] > 10) points.push({ index: winds.length - 1, speed: winds[winds.length - 1] });

    return points;
  }, [displayHours]);

  // Early return if no data to display (after all hooks)
  if (displayHours.length === 0) {
    return null;
  }

  // ========== BEZIER CURVE GENERATION ==========
  // Creates a smooth SVG path through all data points using cubic bezier curves.
  //
  // The tension parameter (0.3) controls curve smoothness:
  // - 0 = straight lines between points
  // - 0.5 = very smooth, may overshoot
  // - 0.3 = good balance of smooth and accurate
  //
  // Each segment uses: C (cubic bezier) with control points offset horizontally
  // by tension * segment_width. This creates smooth curves without overshoot.
  const generateSmoothPath = (values: number[], yScale: (v: number) => number) => {
    if (values.length < 2) return '';

    const points = values.map((v, i) => ({ x: xPos(i), y: yScale(v) }));
    let path = `M ${points[0].x} ${points[0].y}`;  // Move to first point

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const tension = 0.3;
      const dx = (p1.x - p0.x) * tension;
      path += ` C ${p0.x + dx} ${p0.y}, ${p1.x - dx} ${p1.y}, ${p1.x} ${p1.y}`;
    }

    return path;
  };

  const tempPath = activeLayers.has('temp') ? generateSmoothPath(temps, tempY) : '';
  const windPath = activeLayers.has('wind')
    ? generateSmoothPath(displayHours.map(h => h.wind_speed), windY)
    : '';

  const getWindRotation = (direction: number) => direction + 180;

  return (
    <div className="hourly-graph-container">
      {/* Header with title and toggle */}
      <div className="graph-header">
        <h3 className="graph-title">Hourly</h3>
        {!externalHours && (
          <div className="hour-toggle" role="group" aria-label="Hours to display">
            {([6, 12, 24] as HourOption[]).map((hours) => (
              <button
                key={hours}
                className={`toggle-btn ${hoursToShow === hours ? 'active' : ''}`}
                onClick={() => setInternalHours(hours)}
                aria-pressed={hoursToShow === hours}
              >
                {hours}h
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Scrollable Graph */}
      <div className="graph-scroll-wrapper">
        <div className="graph-svg-container">
          <svg
            width={svgWidth}
            height={totalHeight}
            viewBox={`0 0 ${svgWidth} ${totalHeight}`}
            className="hourly-graph-svg"
          >
            {/* Horizontal gridlines */}
            {activeLayers.has('temp') && (
              <>
                {[0, 0.5, 1].map((ratio) => {
                  const y = padding.top + chartHeight * (1 - ratio);
                  return (
                    <line
                      key={`grid-${ratio}`}
                      x1={padding.left}
                      y1={y}
                      x2={svgWidth - padding.right}
                      y2={y}
                      className="graph-gridline"
                    />
                  );
                })}
              </>
            )}

            {/* Y-axis labels - these stay fixed via CSS */}
            {activeLayers.has('temp') && (
              <>
                <text x={padding.left - 4} y={padding.top + 4} className="y-axis-label temp-axis" textAnchor="end">
                  {Math.round(maxTemp)}°
                </text>
                <text x={padding.left - 4} y={graphHeight - padding.bottom + 3} className="y-axis-label temp-axis" textAnchor="end">
                  {Math.round(minTemp)}°
                </text>
              </>
            )}

            {/* Day separators */}
            {displayHours.map((hour, i) => {
              const { day } = formatHour(hour.time, i);
              if (!day || i === 0) return null;
              return (
                <g key={`day-${i}`}>
                  <line
                    x1={xPos(i) - 2}
                    y1={padding.top - 4}
                    x2={xPos(i) - 2}
                    y2={graphHeight + barAreaHeight - padding.bottom}
                    className="graph-day-separator"
                  />
                  <text x={xPos(i) + 4} y={12} className="graph-day-label">
                    {day}
                  </text>
                </g>
              );
            })}

            {/* Wind arrows layer */}
            {activeLayers.has('wind') && displayHours.map((hour, i) => {
              const y = windY(hour.wind_speed);
              return (
                <g key={`wind-${i}`} transform={`translate(${xPos(i)}, ${y})`}>
                  <g transform={`rotate(${getWindRotation(hour.wind_direction)})`}>
                    <path d="M0,-6 L3,3 L0,1 L-3,3 Z" className="wind-arrow" />
                  </g>
                </g>
              );
            })}

            {/* Wind line */}
            {windPath && (
              <>
                <path d={windPath} className="graph-line wind-line" />
                {windPeakPoints.map(({ index, speed }) => (
                  <text
                    key={`wind-label-${index}`}
                    x={xPos(index)}
                    y={windY(speed) - 14}
                    className="wind-label"
                  >
                    {Math.round(speed)}
                  </text>
                ))}
              </>
            )}

            {/* Temperature line */}
            {tempPath && (
              <>
                <path d={tempPath} className="graph-line temp-line" />
                {highLowPoints.map(({ index, isHigh, temp }) => (
                  <g key={`temp-point-${index}`}>
                    <circle cx={xPos(index)} cy={tempY(temp)} r="4" className="temp-point" />
                    <text x={xPos(index)} y={tempY(temp) - 10} className={`temp-label ${isHigh ? 'high' : 'low'}`}>
                      {Math.round(temp)}°
                    </text>
                  </g>
                ))}
              </>
            )}

            {/* Precipitation bars */}
            {activeLayers.has('precip') && displayHours.map((hour, i) => {
              if (isSnowCode(hour.weather_code)) return null;

              const barWidth = Math.min(12, hourWidth * 0.4);
              const minBarHeight = 3;
              const precipHeight = hour.precipitation > 0
                ? Math.max(minBarHeight, (hour.precipitation / maxPrecip) * (barAreaHeight - 8))
                : minBarHeight;
              const hasPrecip = hour.precipitation > 0;
              const showLabel = hour.precipitation >= 0.5;

              return (
                <g key={`precip-${i}`}>
                  <rect
                    x={xPos(i) - barWidth / 2}
                    y={graphHeight + barAreaHeight - padding.bottom - precipHeight}
                    width={barWidth}
                    height={precipHeight}
                    className={`precip-bar ${!hasPrecip ? 'precip-bar-empty' : ''}`}
                    rx="2"
                  />
                  {showLabel && (
                    <text
                      x={xPos(i)}
                      y={graphHeight + barAreaHeight - padding.bottom - precipHeight - 4}
                      className="precip-label"
                    >
                      {hour.precipitation.toFixed(1)}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Snow bars */}
            {activeLayers.has('snow') && displayHours.map((_, i) => {
              const snow = snowData[i];
              if (snow === 0) return null;

              const barWidth = Math.min(12, hourWidth * 0.4);
              const snowHeight = Math.max(3, (snow / maxSnow) * (barAreaHeight - 8));
              const showLabel = snow >= 0.1;

              return (
                <g key={`snow-${i}`}>
                  <rect
                    x={xPos(i) - barWidth / 2}
                    y={graphHeight + barAreaHeight - padding.bottom - snowHeight}
                    width={barWidth}
                    height={snowHeight}
                    className="snow-bar"
                    rx="2"
                  />
                  {showLabel && (
                    <text
                      x={xPos(i)}
                      y={graphHeight + barAreaHeight - padding.bottom - snowHeight - 4}
                      className="snow-label"
                    >
                      {snow.toFixed(1)}"
                    </text>
                  )}
                </g>
              );
            })}

            {/* X-axis time labels */}
            {displayHours.map((hour, i) => {
              const { time } = formatHour(hour.time, i);
              return (
                <text key={`time-${i}`} x={xPos(i)} y={totalHeight - 6} className="graph-time-label">
                  {time}
                </text>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Layer toggles */}
      <div className="graph-layer-toggles" role="group" aria-label="Graph data layers">
        <button
          className={`graph-toggle ${activeLayers.has('temp') ? 'active temp' : ''}`}
          onClick={() => toggleLayer('temp')}
          aria-pressed={activeLayers.has('temp')}
        >
          <span className="toggle-dot temp" aria-hidden="true" />
          Temp
        </button>
        <button
          className={`graph-toggle ${activeLayers.has('precip') ? 'active precip' : ''}`}
          onClick={() => toggleLayer('precip')}
          aria-pressed={activeLayers.has('precip')}
        >
          <span className="toggle-dot precip" aria-hidden="true" />
          Rain
        </button>
        <button
          className={`graph-toggle ${activeLayers.has('snow') ? 'active snow' : ''}`}
          onClick={() => toggleLayer('snow')}
          aria-pressed={activeLayers.has('snow')}
        >
          <span className="toggle-dot snow" aria-hidden="true" />
          Snow
        </button>
        <button
          className={`graph-toggle ${activeLayers.has('wind') ? 'active wind' : ''}`}
          onClick={() => toggleLayer('wind')}
          aria-pressed={activeLayers.has('wind')}
        >
          <span className="toggle-dot wind" aria-hidden="true" />
          Wind
        </button>
      </div>
    </div>
  );
}
