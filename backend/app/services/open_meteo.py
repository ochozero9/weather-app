import asyncio
from datetime import datetime
from typing import Any, Dict, List, Optional

import httpx

from app.config import settings


class OpenMeteoClient:
    """Client for fetching weather data from Open-Meteo API."""

    def __init__(self):
        self.base_url = settings.open_meteo_base_url
        self.models = settings.weather_models

    async def fetch_forecast(
        self,
        latitude: float,
        longitude: float,
        model: str
    ) -> Optional[Dict[str, Any]]:
        """Fetch forecast from a specific model."""
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "hourly": [
                "temperature_2m",
                "relative_humidity_2m",
                "dew_point_2m",
                "cloud_cover",
                "precipitation",
                "precipitation_probability",
                "weather_code",
                "wind_speed_10m",
                "wind_direction_10m",
            ],
            "daily": [
                "temperature_2m_max",
                "temperature_2m_min",
                "precipitation_sum",
                "precipitation_probability_max",
                "weather_code",
                "wind_speed_10m_max",
                "sunrise",
                "sunset",
            ],
            "current": [
                "temperature_2m",
                "apparent_temperature",
                "relative_humidity_2m",
                "precipitation",
                "weather_code",
                "wind_speed_10m",
                "wind_direction_10m",
                "uv_index",
                "visibility",
            ],
            "timezone": "auto",
            "forecast_days": 10,
            "models": model,
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.get(f"{self.base_url}/forecast", params=params)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as e:
                print(f"Error fetching {model}: {e}")
                return None

    async def fetch_all_models(
        self,
        latitude: float,
        longitude: float
    ) -> Dict[str, Dict[str, Any]]:
        """Fetch forecasts from all configured models in parallel."""
        tasks = [
            self.fetch_forecast(latitude, longitude, model)
            for model in self.models
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        model_data = {}
        for model, result in zip(self.models, results):
            if isinstance(result, dict):
                model_data[model] = result
            elif isinstance(result, Exception):
                print(f"Exception for {model}: {result}")

        return model_data

    async def fetch_current_weather(
        self,
        latitude: float,
        longitude: float
    ) -> Optional[Dict[str, Any]]:
        """Fetch current weather conditions."""
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "current": [
                "temperature_2m",
                "apparent_temperature",
                "relative_humidity_2m",
                "precipitation",
                "weather_code",
                "wind_speed_10m",
                "wind_direction_10m",
                "uv_index",
                "visibility",
            ],
            "timezone": "auto",
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.get(f"{self.base_url}/forecast", params=params)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as e:
                print(f"Error fetching current weather: {e}")
                return None

    async def fetch_historical_observations(
        self,
        latitude: float,
        longitude: float,
        start_date: str,
        end_date: str
    ) -> Optional[Dict[str, Any]]:
        """Fetch historical weather observations for verification."""
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "start_date": start_date,
            "end_date": end_date,
            "hourly": [
                "temperature_2m",
                "precipitation",
                "wind_speed_10m",
                "weather_code",
            ],
            "timezone": "auto",
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                # Use the historical API for past observations
                response = await client.get(
                    "https://archive-api.open-meteo.com/v1/archive",
                    params=params
                )
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as e:
                print(f"Error fetching historical data: {e}")
                return None

    async def geocode(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Search for locations by name."""
        params = {
            "name": query,
            "count": limit,
            "language": "en",
            "format": "json",
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                response = await client.get(
                    "https://geocoding-api.open-meteo.com/v1/search",
                    params=params
                )
                response.raise_for_status()
                data = response.json()
                return data.get("results", [])
            except httpx.HTTPError as e:
                print(f"Error geocoding: {e}")
                return []

    async def geocode_zip(self, zip_code: str, country: str = "us") -> Optional[Dict[str, Any]]:
        """Search for location by zip/postal code using Zippopotam.us API."""
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                response = await client.get(
                    f"https://api.zippopotam.us/{country}/{zip_code}"
                )
                response.raise_for_status()
                data = response.json()

                # Parse Zippopotam response format
                if data and "places" in data and len(data["places"]) > 0:
                    place = data["places"][0]
                    return {
                        "name": place.get("place name", zip_code),
                        "latitude": float(place.get("latitude", 0)),
                        "longitude": float(place.get("longitude", 0)),
                        "country": data.get("country", country.upper()),
                        "country_code": data.get("country abbreviation", country.upper()),
                        "admin1": place.get("state", ""),
                        "timezone": "auto",  # Will be determined by Open-Meteo
                        "postal_code": zip_code,
                    }
                return None
            except httpx.HTTPError as e:
                print(f"Error geocoding zip: {e}")
                return None

    async def fetch_air_quality(
        self,
        latitude: float,
        longitude: float
    ) -> Optional[Dict[str, Any]]:
        """Fetch current air quality data."""
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "current": ["us_aqi", "pm2_5", "pm10"],
            "timezone": "auto",
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                response = await client.get(
                    "https://air-quality-api.open-meteo.com/v1/air-quality",
                    params=params
                )
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as e:
                print(f"Error fetching air quality: {e}")
                return None


open_meteo_client = OpenMeteoClient()
