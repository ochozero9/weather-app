"""
Open-Meteo API Client
=====================
Handles all external API communication for weather data.

External Dependencies:
- api.open-meteo.com: Main forecast API (free, no API key required)
- archive-api.open-meteo.com: Historical data for accuracy verification
- geocoding-api.open-meteo.com: Location search by name
- air-quality-api.open-meteo.com: AQI data
- api.zippopotam.us: ZIP/postal code lookup (third-party, not Open-Meteo)

Error Handling Strategy:
- Individual model failures are logged and skipped (graceful degradation)
- No automatic retries (forecasts are ephemeral, retry at higher layer)
- Client errors return None, callers must handle missing data

Performance:
- Single httpx.AsyncClient reused for connection pooling
- Parallel fetching of all weather models
- 30-second timeout per request
"""
import asyncio
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

# ============================================
# API Parameters
# ============================================
# These map directly to Open-Meteo query parameters.
# See: https://open-meteo.com/en/docs for full documentation.
#
# Parameter naming follows WMO conventions:
# - "_2m" = measured at 2 meters above ground
# - "_10m" = measured at 10 meters above ground
HOURLY_PARAMS = [
    "temperature_2m",
    "relative_humidity_2m",
    "dew_point_2m",
    "cloud_cover",
    "precipitation",
    "precipitation_probability",
    "weather_code",
    "wind_speed_10m",
    "wind_direction_10m",
]

DAILY_PARAMS = [
    "temperature_2m_max",
    "temperature_2m_min",
    "precipitation_sum",
    "precipitation_probability_max",
    "weather_code",
    "wind_speed_10m_max",
    "sunrise",
    "sunset",
]

CURRENT_PARAMS = [
    "temperature_2m",
    "apparent_temperature",
    "relative_humidity_2m",
    "precipitation",
    "weather_code",
    "wind_speed_10m",
    "wind_direction_10m",
    "uv_index",
    "visibility",
]

HISTORICAL_HOURLY_PARAMS = [
    "temperature_2m",
    "precipitation",
    "wind_speed_10m",
    "weather_code",
]


class OpenMeteoClient:
    """
    Client for fetching weather data from Open-Meteo API.

    Lifecycle: Must call startup() before use and shutdown() on app termination.
    Uses a single httpx.AsyncClient for connection pooling across all requests.

    Thread Safety: This client is designed for single-threaded async use.
    The httpx.AsyncClient handles concurrent requests safely.
    """

    def __init__(self):
        self.base_url = settings.open_meteo_base_url
        self.models = settings.weather_models
        self._client: Optional[httpx.AsyncClient] = None

    async def startup(self) -> None:
        """Initialize the HTTP client. Call during app startup (lifespan)."""
        # Single client instance for connection pooling benefits:
        # - Reuses TCP connections across requests
        # - Maintains connection pool to API servers
        # - 30s timeout balances responsiveness with slow API recovery
        self._client = httpx.AsyncClient(timeout=30.0)

    async def shutdown(self) -> None:
        """Close the HTTP client. Call during app shutdown."""
        if self._client:
            await self._client.aclose()
            self._client = None

    @property
    def client(self) -> httpx.AsyncClient:
        """Get the HTTP client, raising if not initialized."""
        if self._client is None:
            raise RuntimeError("OpenMeteoClient not started. Call startup() first.")
        return self._client

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
            "hourly": HOURLY_PARAMS,
            "daily": DAILY_PARAMS,
            "current": CURRENT_PARAMS,
            "timezone": "auto",
            "forecast_days": 10,
            "models": model,
        }

        try:
            response = await self.client.get(f"{self.base_url}/forecast", params=params)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            logger.warning("Error fetching %s: %s", model, e)
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
                logger.warning("Exception for %s: %s", model, result)

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
            "current": CURRENT_PARAMS,
            "timezone": "auto",
        }

        try:
            response = await self.client.get(f"{self.base_url}/forecast", params=params)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            logger.warning("Error fetching current weather: %s", e)
            return None

    async def fetch_historical_observations(
        self,
        latitude: float,
        longitude: float,
        start_date: str,
        end_date: str
    ) -> Optional[Dict[str, Any]]:
        """
        Fetch historical weather observations for accuracy verification.

        IMPORTANT: Uses a DIFFERENT API endpoint than forecasts!
        - Forecast API: api.open-meteo.com (predictions)
        - Archive API: archive-api.open-meteo.com (actual observations)

        The archive API provides reanalysis data (ERA5) which is the "ground truth"
        for verifying how accurate our forecasts were.

        Data availability: Archive typically has ~5 day lag from current date.
        """
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "start_date": start_date,
            "end_date": end_date,
            "hourly": HISTORICAL_HOURLY_PARAMS,
            "timezone": "auto",
        }

        try:
            # Archive API is separate from forecast API
            response = await self.client.get(
                "https://archive-api.open-meteo.com/v1/archive",
                params=params
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            logger.warning("Error fetching historical data: %s", e)
            return None

    async def geocode(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Search for locations by name."""
        params = {
            "name": query,
            "count": limit,
            "language": "en",
            "format": "json",
        }

        try:
            response = await self.client.get(
                "https://geocoding-api.open-meteo.com/v1/search",
                params=params
            )
            response.raise_for_status()
            data = response.json()
            return data.get("results", [])
        except httpx.HTTPError as e:
            logger.warning("Error geocoding: %s", e)
            return []

    async def geocode_zip(self, zip_code: str, country: str = "us") -> Optional[Dict[str, Any]]:
        """
        Search for location by zip/postal code using Zippopotam.us API.

        EXTERNAL DEPENDENCY: api.zippopotam.us (third-party, not Open-Meteo)
        - Free, no API key required
        - Supports US, UK, CA, DE, and other countries
        - Returns approximate city center for the postal code

        Limitations:
        - Invalid/non-existent postal codes return HTTP 404
        - No fallback if this service is down
        - Country code must match postal code format (e.g., "us" for 5-digit ZIP)
        """
        try:
            response = await self.client.get(
                f"https://api.zippopotam.us/{country}/{zip_code}"
            )
            response.raise_for_status()
            data = response.json()

            # Parse Zippopotam response format into our GeocodingResult structure
            if data and "places" in data and len(data["places"]) > 0:
                place = data["places"][0]
                return {
                    "name": place.get("place name", zip_code),
                    "latitude": float(place.get("latitude", 0)),
                    "longitude": float(place.get("longitude", 0)),
                    "country": data.get("country", country.upper()),
                    "country_code": data.get("country abbreviation", country.upper()),
                    "admin1": place.get("state", ""),
                    "timezone": "auto",  # Open-Meteo will determine from coordinates
                    "postal_code": zip_code,
                }
            return None
        except httpx.HTTPError as e:
            logger.warning("Error geocoding zip: %s", e)
            return None

    async def fetch_air_quality(
        self,
        latitude: float,
        longitude: float
    ) -> Optional[Dict[str, Any]]:
        """
        Fetch current air quality data.

        Uses US AQI standard (0-500 scale):
        - 0-50: Good
        - 51-100: Moderate
        - 101-150: Unhealthy for sensitive groups
        - 151-200: Unhealthy
        - 201-300: Very unhealthy
        - 301-500: Hazardous

        LOCALIZATION NOTE: Currently hardcoded to "us_aqi".
        For EU users, consider adding "european_aqi" parameter.
        The scales are different and not directly comparable.
        """
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "current": ["us_aqi", "pm2_5", "pm10"],  # US standard
            "timezone": "auto",
        }

        try:
            response = await self.client.get(
                "https://air-quality-api.open-meteo.com/v1/air-quality",
                params=params
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            logger.warning("Error fetching air quality: %s", e)
            return None


open_meteo_client = OpenMeteoClient()
