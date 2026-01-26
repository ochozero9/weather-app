from datetime import datetime
from typing import Dict, List, Optional, Union
from pydantic import BaseModel, ConfigDict


# Location schemas
class LocationCreate(BaseModel):
    name: str
    latitude: float
    longitude: float
    timezone: str
    country: Optional[str] = None


class LocationResponse(BaseModel):
    id: int
    name: str
    latitude: float
    longitude: float
    timezone: str
    country: Optional[str]

    class Config:
        from_attributes = True


# Forecast schemas
class HourlyForecast(BaseModel):
    time: datetime
    temperature: float
    precipitation: float
    precipitation_probability: float
    wind_speed: float
    wind_direction: float
    humidity: float
    dew_point: float
    cloud_cover: float
    weather_code: int
    confidence: float  # 0-100


class DailyForecast(BaseModel):
    date: datetime
    temperature_max: float
    temperature_min: float
    precipitation_sum: float
    precipitation_probability_max: float
    wind_speed_max: float
    weather_code: int
    confidence: float
    sunrise: Optional[str] = None
    sunset: Optional[str] = None


class CurrentWeather(BaseModel):
    temperature: float
    apparent_temperature: float
    humidity: float
    precipitation: float
    wind_speed: float
    wind_direction: float
    weather_code: int
    uv_index: Optional[float] = None
    visibility: Optional[float] = None  # in meters
    aqi: Optional[int] = None  # US Air Quality Index


class ModelPrediction(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    model_name: str
    temperature: float
    precipitation: float
    wind_speed: float


class EnsembleForecastResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    location: Union[LocationResponse, dict]
    current: CurrentWeather
    hourly: List[HourlyForecast]
    daily: List[DailyForecast]
    model_spread: Dict[str, float]  # Spread between models for key metrics


class ModelComparisonResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    location: dict
    time: datetime
    models: List[ModelPrediction]
    ensemble: ModelPrediction


# Accuracy schemas
class ModelAccuracy(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    model_name: str
    temperature_accuracy: float
    precipitation_accuracy: float
    overall_accuracy: float
    sample_count: int


class AccuracyResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    period: str  # "30_days", "7_days", etc.
    ensemble_accuracy: float
    by_lead_time: Dict[str, float]  # {"24h": 95.2, "48h": 91.5, ...}
    model_performance: List[ModelAccuracy]


class AccuracyBadge(BaseModel):
    text: str  # "94% accurate this month"
    accuracy: float
    sample_count: int
    lead_hours: int
