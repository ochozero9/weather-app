export interface Location {
  id?: number;
  name: string;
  latitude: number;
  longitude: number;
  timezone: string;
  country?: string;
  admin1?: string;
}

export interface CurrentWeather {
  temperature: number;
  apparent_temperature: number;
  humidity: number;
  precipitation: number;
  wind_speed: number;
  wind_direction: number;
  weather_code: number;
  uv_index?: number;
  visibility?: number; // in meters
  aqi?: number; // US Air Quality Index
}

export interface HourlyForecast {
  time: string;
  temperature: number;
  precipitation: number;
  precipitation_probability: number;
  wind_speed: number;
  wind_direction: number;
  humidity: number;
  dew_point: number;
  cloud_cover: number;
  weather_code: number;
  confidence: number;
}

export interface DailyForecast {
  date: string;
  temperature_max: number;
  temperature_min: number;
  precipitation_sum: number;
  precipitation_probability_max: number;
  wind_speed_max: number;
  weather_code: number;
  confidence: number;
  sunrise?: string;
  sunset?: string;
}

export interface EnsembleForecast {
  location: {
    latitude: number;
    longitude: number;
    timezone: string;
  };
  current: CurrentWeather;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
  model_spread: {
    temperature: number;
    precipitation: number;
    wind_speed: number;
  };
}

export interface ModelPrediction {
  model_name: string;
  temperature: number | null;
  precipitation: number | null;
  wind_speed: number | null;
}

export interface ModelComparison {
  location: { latitude: number; longitude: number };
  time: string;
  models: ModelPrediction[];
  ensemble: ModelPrediction;
}

export interface AccuracyBadge {
  text: string;
  accuracy: number;
  sample_count: number;
  lead_hours: number;
}

export interface ModelAccuracy {
  model_name: string;
  temperature_accuracy: number;
  precipitation_accuracy: number;
  overall_accuracy: number;
  sample_count: number;
}

export interface AccuracyMetrics {
  period: string;
  ensemble_accuracy: number;
  by_lead_time: Record<string, number>;
  model_performance: ModelAccuracy[];
}

export interface GeocodingResult {
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1: string;
  timezone: string;
}

// Weather code descriptions
export const WEATHER_CODES: Record<number, { description: string; icon: string }> = {
  0: { description: 'Clear sky', icon: '☀️' },
  1: { description: 'Mainly clear', icon: '🌤️' },
  2: { description: 'Partly cloudy', icon: '⛅' },
  3: { description: 'Overcast', icon: '☁️' },
  45: { description: 'Fog', icon: '🌫️' },
  48: { description: 'Depositing rime fog', icon: '🌫️' },
  51: { description: 'Light drizzle', icon: '🌧️' },
  53: { description: 'Moderate drizzle', icon: '🌧️' },
  55: { description: 'Dense drizzle', icon: '🌧️' },
  61: { description: 'Slight rain', icon: '🌧️' },
  63: { description: 'Moderate rain', icon: '🌧️' },
  65: { description: 'Heavy rain', icon: '🌧️' },
  66: { description: 'Light freezing rain', icon: '🌨️' },
  67: { description: 'Heavy freezing rain', icon: '🌨️' },
  71: { description: 'Slight snow', icon: '🌨️' },
  73: { description: 'Moderate snow', icon: '🌨️' },
  75: { description: 'Heavy snow', icon: '🌨️' },
  77: { description: 'Snow grains', icon: '🌨️' },
  80: { description: 'Slight rain showers', icon: '🌦️' },
  81: { description: 'Moderate rain showers', icon: '🌦️' },
  82: { description: 'Violent rain showers', icon: '🌦️' },
  85: { description: 'Slight snow showers', icon: '🌨️' },
  86: { description: 'Heavy snow showers', icon: '🌨️' },
  95: { description: 'Thunderstorm', icon: '⛈️' },
  96: { description: 'Thunderstorm with hail', icon: '⛈️' },
  99: { description: 'Thunderstorm with heavy hail', icon: '⛈️' },
};
