import { useState, useEffect } from 'react';
import type { ModelComparison as ModelComparisonType } from '../types/weather';
import { getModelComparison } from '../api/client';
import type { TempUnit } from '../utils/weather';
import { convertTemp } from '../utils/weather';
import './ModelComparison.css';

interface ModelComparisonProps {
  latitude: number;
  longitude: number;
  unit: TempUnit;
}

const MODEL_DISPLAY_NAMES: Record<string, string> = {
  gfs_seamless: 'GFS (NOAA)',
  ecmwf_ifs04: 'ECMWF',
  icon_seamless: 'ICON (DWD)',
  gem_seamless: 'GEM (Canada)',
  jma_seamless: 'JMA (Japan)',
  meteofrance_seamless: 'Météo-France',
  ensemble: 'Ensemble',
};

export function ModelComparison({ latitude, longitude, unit }: ModelComparisonProps) {
  const [comparison, setComparison] = useState<ModelComparisonType | null>(null);
  const [loading, setLoading] = useState(false);
  const [hourOffset, setHourOffset] = useState(0);

  useEffect(() => {
    async function fetchComparison() {
      setLoading(true);
      try {
        const data = await getModelComparison(latitude, longitude, hourOffset);
        setComparison(data);
      } catch (error) {
        console.error('Failed to fetch model comparison:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchComparison();
  }, [latitude, longitude, hourOffset]);

  if (loading) {
    return <div className="model-comparison loading">Loading model data...</div>;
  }

  if (!comparison) {
    return null;
  }

  // Filter out models with null values and add ensemble
  const validModels = comparison.models.filter(
    (m) => m.temperature !== null && m.precipitation !== null && m.wind_speed !== null
  );
  const allModels = [...validModels, comparison.ensemble];

  const formatTemp = (value: number | null): string => {
    if (value === null || value === undefined) return 'N/A';
    return `${convertTemp(value, unit).toFixed(1)} °${unit}`;
  };

  const formatValue = (value: number | null, unitStr: string): string => {
    if (value === null || value === undefined) return 'N/A';
    return `${value.toFixed(1)} ${unitStr}`;
  };

  return (
    <div className="model-comparison">
      <div className="comparison-header">
        <h3>Model Comparison</h3>
        <select
          value={hourOffset}
          onChange={(e) => setHourOffset(Number(e.target.value))}
          className="hour-selector"
        >
          <option value={0}>Now</option>
          <option value={6}>+6 hours</option>
          <option value={12}>+12 hours</option>
          <option value={24}>+24 hours</option>
          <option value={48}>+48 hours</option>
          <option value={72}>+72 hours</option>
        </select>
      </div>

      <table className="comparison-table">
        <thead>
          <tr>
            <th>Model</th>
            <th>Temperature</th>
            <th>Precipitation</th>
            <th>Wind</th>
          </tr>
        </thead>
        <tbody>
          {allModels.map((model) => (
            <tr
              key={model.model_name}
              className={model.model_name === 'ensemble' ? 'ensemble-row' : ''}
            >
              <td className="model-name">
                {MODEL_DISPLAY_NAMES[model.model_name] || model.model_name}
              </td>
              <td>{formatTemp(model.temperature)}</td>
              <td>{formatValue(model.precipitation, 'mm')}</td>
              <td>{formatValue(model.wind_speed, 'km/h')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
