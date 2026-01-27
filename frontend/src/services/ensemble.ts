/**
 * Ensemble Calculator
 * ===================
 * Combines predictions from multiple weather models into a single
 * ensemble forecast using weighted averaging.
 *
 * Key algorithms:
 * - Weighted average with normalization for missing models
 * - Confidence via exponential decay: 100 * e^(-spread/typical)
 * - Weather code selection via MODE (most common prediction)
 */

import type {
  CurrentWeather,
  DailyForecast,
  EnsembleForecast,
  HourlyForecast,
  ModelComparison,
  ModelPrediction,
} from '../types/weather';
import type { RawModelForecast, AirQualityData } from './openMeteo';
import { MODEL_WEIGHTS, type WeatherModel } from './openMeteo';

// Typical spread values for confidence calculation
const TYPICAL_SPREAD = {
  temperature: 3.0,
  precipitation: 5.0,
  wind_speed: 5.0,
};

/**
 * Calculate weighted average of values with normalized weights.
 * Skips null/undefined values and normalizes remaining weights.
 */
function weightedAverage(
  values: (number | null | undefined)[],
  models: WeatherModel[]
): number {
  let sum = 0;
  let weightSum = 0;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (v != null) {
      const w = MODEL_WEIGHTS[models[i]] ?? 1.0;
      sum += v * w;
      weightSum += w;
    }
  }
  return weightSum > 0 ? sum / weightSum : 0;
}

/**
 * Standard deviation (unweighted) of non-null values.
 */
function spread(values: (number | null | undefined)[]): number {
  const valid = values.filter((v): v is number => v != null);
  if (valid.length < 2) return 0;
  const mean = valid.reduce((a, b) => a + b, 0) / valid.length;
  const variance = valid.reduce((a, v) => a + (v - mean) ** 2, 0) / valid.length;
  return Math.sqrt(variance);
}

/**
 * Confidence from spread using exponential decay.
 * spread=0 → 100%, spread=typical → ~37%, spread=2x → ~13%
 */
function confidence(spreadVal: number, typicalSpread: number): number {
  return Math.round(100 * Math.exp(-spreadVal / typicalSpread));
}

/**
 * Mode of values (most common). Tie-breaker: highest value (more severe weather).
 */
function mode(values: (number | null | undefined)[]): number {
  const valid = values.filter((v): v is number => v != null);
  if (valid.length === 0) return 0;
  const counts = new Map<number, number>();
  for (const v of valid) counts.set(v, (counts.get(v) || 0) + 1);
  let maxCount = 0;
  let result = 0;
  for (const [val, count] of counts) {
    if (count > maxCount || (count === maxCount && val > result)) {
      maxCount = count;
      result = val;
    }
  }
  return result;
}

function round(v: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round(v * f) / f;
}

/**
 * Build the ensemble forecast from raw model data.
 */
export function calculateEnsemble(
  modelData: RawModelForecast[],
  airQuality: AirQualityData | null
): EnsembleForecast {
  const models = modelData.map((d) => d.model);
  const ref = modelData[0]; // Reference model for time arrays & location

  // --- Current Weather ---
  const current = buildCurrent(modelData, models, airQuality);

  // --- Hourly Forecast (168 hours = 7 days) ---
  const hourlyLen = Math.min(168, ref.hourly.time.length);
  const hourly: HourlyForecast[] = [];
  const tempSpreads: number[] = [];
  const precipSpreads: number[] = [];
  const windSpreads: number[] = [];

  for (let i = 0; i < hourlyLen; i++) {
    const temps = modelData.map((d) => d.hourly.temperature_2m[i]);
    const precips = modelData.map((d) => d.hourly.precipitation[i]);
    const winds = modelData.map((d) => d.hourly.wind_speed_10m[i]);

    const tSpread = spread(temps);
    const pSpread = spread(precips);
    const wSpread = spread(winds);
    tempSpreads.push(tSpread);
    precipSpreads.push(pSpread);
    windSpreads.push(wSpread);

    const tConf = confidence(tSpread, TYPICAL_SPREAD.temperature);
    const pConf = confidence(pSpread, TYPICAL_SPREAD.precipitation);
    const wConf = confidence(wSpread, TYPICAL_SPREAD.wind_speed);

    hourly.push({
      time: ref.hourly.time[i],
      temperature: round(weightedAverage(temps, models), 1),
      precipitation: round(weightedAverage(precips, models), 1),
      precipitation_probability: Math.round(
        weightedAverage(modelData.map((d) => d.hourly.precipitation_probability[i]), models)
      ),
      wind_speed: round(weightedAverage(winds, models), 1),
      wind_direction: Math.round(
        weightedAverage(modelData.map((d) => d.hourly.wind_direction_10m[i]), models)
      ),
      humidity: Math.round(
        weightedAverage(modelData.map((d) => d.hourly.relative_humidity_2m[i]), models)
      ),
      dew_point: round(
        weightedAverage(modelData.map((d) => d.hourly.dew_point_2m[i]), models), 1
      ),
      cloud_cover: Math.round(
        weightedAverage(modelData.map((d) => d.hourly.cloud_cover[i]), models)
      ),
      weather_code: mode(modelData.map((d) => d.hourly.weather_code[i])),
      confidence: Math.round((tConf + pConf + wConf) / 3),
    });
  }

  // --- Daily Forecast ---
  const daily = buildDaily(modelData, models, hourly);

  // --- Model Spread (average across all hours) ---
  const avgSpread = (arr: number[]) =>
    arr.length > 0 ? round(arr.reduce((a, b) => a + b, 0) / arr.length, 1) : 0;

  return {
    location: {
      latitude: ref.latitude,
      longitude: ref.longitude,
      timezone: ref.timezone,
    },
    current,
    hourly,
    daily,
    model_spread: {
      temperature: avgSpread(tempSpreads),
      precipitation: avgSpread(precipSpreads),
      wind_speed: avgSpread(windSpreads),
    },
  };
}

function buildCurrent(
  modelData: RawModelForecast[],
  models: WeatherModel[],
  airQuality: AirQualityData | null
): CurrentWeather {
  const currents = modelData.map((d) => d.current).filter((c) => c != null);

  if (currents.length === 0) {
    // Fallback to first hourly value
    return {
      temperature: modelData[0]?.hourly.temperature_2m[0] ?? 0,
      apparent_temperature: 0,
      humidity: modelData[0]?.hourly.relative_humidity_2m[0] ?? 0,
      precipitation: modelData[0]?.hourly.precipitation[0] ?? 0,
      wind_speed: modelData[0]?.hourly.wind_speed_10m[0] ?? 0,
      wind_direction: modelData[0]?.hourly.wind_direction_10m[0] ?? 0,
      weather_code: modelData[0]?.hourly.weather_code[0] ?? 0,
    };
  }

  return {
    temperature: round(weightedAverage(currents.map((c) => c!.temperature_2m), models), 1),
    apparent_temperature: round(weightedAverage(currents.map((c) => c!.apparent_temperature), models), 1),
    humidity: Math.round(weightedAverage(currents.map((c) => c!.relative_humidity_2m), models)),
    precipitation: round(weightedAverage(currents.map((c) => c!.precipitation), models), 1),
    wind_speed: round(weightedAverage(currents.map((c) => c!.wind_speed_10m), models), 1),
    wind_direction: Math.round(weightedAverage(currents.map((c) => c!.wind_direction_10m), models)),
    weather_code: mode(currents.map((c) => c!.weather_code)),
    uv_index: currents[0]?.uv_index ?? undefined,
    visibility: currents[0]?.visibility ?? undefined,
    aqi: airQuality?.us_aqi ?? undefined,
  };
}

function buildDaily(
  modelData: RawModelForecast[],
  models: WeatherModel[],
  hourly: HourlyForecast[]
): DailyForecast[] {
  const ref = modelData[0];
  const dailyLen = Math.min(10, ref.daily.time.length);
  const daily: DailyForecast[] = [];

  for (let i = 0; i < dailyLen; i++) {
    const maxTemps = modelData.map((d) => d.daily.temperature_2m_max[i]);
    const minTemps = modelData.map((d) => d.daily.temperature_2m_min[i]);
    const precipSums = modelData.map((d) => d.daily.precipitation_sum[i]);
    const precipProbs = modelData.map((d) => d.daily.precipitation_probability_max[i]);
    const winds = modelData.map((d) => d.daily.wind_speed_10m_max[i]);

    const tSpread = spread(maxTemps);
    const pSpread = spread(precipSums);
    const wSpread = spread(winds);
    const tConf = confidence(tSpread, TYPICAL_SPREAD.temperature);
    const pConf = confidence(pSpread, TYPICAL_SPREAD.precipitation);
    const wConf = confidence(wSpread, TYPICAL_SPREAD.wind_speed);

    // Fallback: if daily precip probability is 0 but hourly shows rain,
    // use max of hourly probabilities for that day
    let precipProb = Math.round(weightedAverage(precipProbs, models));
    if (precipProb === 0) {
      const dayDate = ref.daily.time[i];
      const dayHourly = hourly.filter((h) => h.time.startsWith(dayDate));
      const maxHourlyProb = dayHourly.reduce(
        (max, h) => Math.max(max, h.precipitation_probability),
        0
      );
      if (maxHourlyProb > 0) precipProb = maxHourlyProb;
    }

    daily.push({
      date: ref.daily.time[i],
      temperature_max: round(weightedAverage(maxTemps, models), 1),
      temperature_min: round(weightedAverage(minTemps, models), 1),
      precipitation_sum: round(weightedAverage(precipSums, models), 1),
      precipitation_probability_max: precipProb,
      wind_speed_max: round(weightedAverage(winds, models), 1),
      weather_code: mode(modelData.map((d) => d.daily.weather_code[i])),
      confidence: Math.round((tConf + pConf + wConf) / 3),
      sunrise: ref.daily.sunrise[i] ?? undefined,
      sunset: ref.daily.sunset[i] ?? undefined,
    });
  }

  return daily;
}

/**
 * Build model comparison data for a specific hour offset.
 */
export function buildModelComparison(
  modelData: RawModelForecast[],
  hourOffset: number
): ModelComparison {
  const ref = modelData[0];
  const idx = Math.min(hourOffset, ref.hourly.time.length - 1);
  const models = modelData.map((d) => d.model);

  const predictions: ModelPrediction[] = modelData.map((d) => ({
    model_name: d.model,
    temperature: d.hourly.temperature_2m[idx],
    precipitation: d.hourly.precipitation[idx],
    wind_speed: d.hourly.wind_speed_10m[idx],
  }));

  const ensemble: ModelPrediction = {
    model_name: 'ensemble',
    temperature: round(
      weightedAverage(modelData.map((d) => d.hourly.temperature_2m[idx]), models), 1
    ),
    precipitation: round(
      weightedAverage(modelData.map((d) => d.hourly.precipitation[idx]), models), 1
    ),
    wind_speed: round(
      weightedAverage(modelData.map((d) => d.hourly.wind_speed_10m[idx]), models), 1
    ),
  };

  return {
    location: { latitude: ref.latitude, longitude: ref.longitude },
    time: ref.hourly.time[idx],
    models: predictions,
    ensemble,
  };
}
