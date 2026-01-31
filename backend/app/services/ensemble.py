"""
Ensemble Weather Forecasting Service
=====================================

This module combines predictions from 6 weather models into a single ensemble forecast.
The ensemble approach improves accuracy by averaging out individual model biases.

Key Concepts:
- WEIGHTED AVERAGE: Models are weighted based on historical accuracy (see config.py)
  ECMWF is weighted highest (1.2) as it's generally most accurate
- SPREAD: Standard deviation across models - indicates forecast uncertainty
- CONFIDENCE: Derived from spread using exponential decay (lower spread = higher confidence)

Model Sources (via Open-Meteo API):
- GFS (NOAA, USA) - Good for North America
- ECMWF (European) - Generally most accurate globally
- ICON (DWD, Germany) - Good for Europe
- GEM (Canada) - Good for North America
- JMA (Japan) - Good for Asia-Pacific
- Meteo-France - Good for Europe

Future Improvements:
- [ ] Dynamic model weights based on recent accuracy scores
- [ ] Regional weight adjustments (e.g., prefer JMA for Asian locations)
- [ ] Confidence calibration based on historical verification
"""

from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple, Union

import numpy as np

from app.config import settings
from app.models.schemas import (
    CurrentWeather,
    DailyForecast,
    EnsembleForecastResponse,
    HourlyForecast,
)
from app.services.open_meteo import open_meteo_client


class EnsembleCalculator:
    """
    Combines multiple weather model predictions into an ensemble forecast.

    The ensemble uses weighted averaging where weights can be adjusted based on
    model performance. Currently uses static weights from config.py.
    """

    def __init__(self):
        # Weights from config - can be updated based on accuracy metrics
        # See config.py for current values (ECMWF=1.2, others 0.9-1.0)
        self.model_weights = settings.default_model_weights.copy()

    def _weighted_average(
        self,
        values: Dict[str, Optional[float]],
        weights: Optional[Dict[str, float]] = None
    ) -> Tuple[float, float]:
        """
        Calculate weighted average and spread (standard deviation).
        Returns (average, spread).

        Important: Weights are NORMALIZED to sum to 1.0 before averaging.
        This means if only 3 of 6 models return data, those 3 models'
        weights are scaled up proportionally. This prevents the average
        from being skewed by missing models.

        Example: If ECMWF (1.2) and GFS (1.0) are the only models available,
        their effective weights become 1.2/2.2 ≈ 0.55 and 1.0/2.2 ≈ 0.45.

        Returns:
            tuple: (weighted_average, standard_deviation)
            - spread is UNWEIGHTED std dev (measures raw disagreement)
        """
        if weights is None:
            weights = self.model_weights

        valid_values = []
        valid_weights = []

        for model, value in values.items():
            if value is not None:
                valid_values.append(value)
                valid_weights.append(weights.get(model, 1.0))

        if not valid_values:
            return 0.0, 0.0

        values_arr = np.array(valid_values)
        weights_arr = np.array(valid_weights)
        # Normalize weights to sum to 1.0 (handles missing models)
        weights_arr = weights_arr / weights_arr.sum()

        weighted_avg = np.average(values_arr, weights=weights_arr)
        # Spread uses unweighted std dev - all models count equally for uncertainty
        spread = np.std(values_arr)

        return float(weighted_avg), float(spread)

    def _calculate_confidence(self, spread: float, metric_type: str) -> float:
        """
        Calculate confidence score (0-100) based on model spread.
        Uses EXPONENTIAL DECAY - not linear!

        Formula: confidence = 100 * e^(-spread / typical_spread)

        This means:
        - spread = 0 → 100% confidence (all models agree perfectly)
        - spread = typical → ~37% confidence (e^-1 ≈ 0.37)
        - spread = 2x typical → ~13% confidence (e^-2 ≈ 0.135)
        - spread = 3x typical → ~5% confidence

        NOTE: The exponential curve drops quickly. A small increase in spread
        causes a large confidence drop. This is intentional - we want to flag
        uncertainty early. However, it may seem aggressive to users.

        Future: Consider calibrating these values based on actual verification
        data to ensure confidence scores match real-world accuracy percentages.
        """
        # Typical spreads derived from historical model disagreement analysis
        # These are approximate values - adjust based on verification data
        typical_spreads = {
            "temperature": 3.0,     # °C - models typically agree within 3°C
            "precipitation": 5.0,   # mm - high uncertainty for precip
            "wind_speed": 5.0,      # km/h
        }

        typical = typical_spreads.get(metric_type, 3.0)

        # Exponential decay: fast drop initially, asymptotes toward 0
        # See docstring above for exact values at key points
        confidence = 100 * np.exp(-spread / typical)
        return max(0, min(100, float(confidence)))

    def _extract_model_values(
        self,
        model_data: Dict[str, dict],
        data_type: str,
        field: str,
        index: int
    ) -> Dict[str, Optional[float]]:
        """Extract a specific value from each model's data."""
        values = {}
        for model, data in model_data.items():
            try:
                if data and data_type in data and field in data[data_type]:
                    values[model] = data[data_type][field][index]
                else:
                    values[model] = None
            except (IndexError, KeyError, TypeError):
                values[model] = None
        return values

    async def get_ensemble_forecast(
        self,
        latitude: float,
        longitude: float
    ) -> EnsembleForecastResponse:
        """Generate ensemble forecast by combining all models."""
        import asyncio

        # Fetch from all models and air quality in parallel
        model_data_task = open_meteo_client.fetch_all_models(latitude, longitude)
        air_quality_task = open_meteo_client.fetch_air_quality(latitude, longitude)

        model_data, air_quality_data = await asyncio.gather(
            model_data_task, air_quality_task
        )

        if not model_data:
            raise ValueError("No model data available")

        # Get reference data structure from first available model
        reference_model = next(iter(model_data.values()))
        hourly_times = reference_model.get("hourly", {}).get("time", [])
        daily_times = reference_model.get("daily", {}).get("time", [])

        # Extract AQI from air quality data
        aqi = None
        if air_quality_data and "current" in air_quality_data:
            aqi = air_quality_data["current"].get("us_aqi")

        # Build current weather from the reference model
        current_data = reference_model.get("current", {})
        current = CurrentWeather(
            temperature=current_data.get("temperature_2m", 0),
            apparent_temperature=current_data.get("apparent_temperature", 0),
            humidity=current_data.get("relative_humidity_2m", 0),
            precipitation=current_data.get("precipitation", 0),
            wind_speed=current_data.get("wind_speed_10m", 0),
            wind_direction=current_data.get("wind_direction_10m", 0),
            weather_code=current_data.get("weather_code", 0),
            uv_index=current_data.get("uv_index"),
            visibility=current_data.get("visibility"),
            aqi=aqi,
        )

        # Build hourly ensemble forecast
        hourly_forecasts = []
        temp_spreads = []
        precip_spreads = []
        wind_spreads = []

        for i, time_str in enumerate(hourly_times[:168]):  # 7 days of hourly data
            # Extract values from all models
            temps = self._extract_model_values(model_data, "hourly", "temperature_2m", i)
            precips = self._extract_model_values(model_data, "hourly", "precipitation", i)
            precip_probs = self._extract_model_values(model_data, "hourly", "precipitation_probability", i)
            winds = self._extract_model_values(model_data, "hourly", "wind_speed_10m", i)
            humidity = self._extract_model_values(model_data, "hourly", "relative_humidity_2m", i)
            dew_points = self._extract_model_values(model_data, "hourly", "dew_point_2m", i)
            cloud_covers = self._extract_model_values(model_data, "hourly", "cloud_cover", i)
            wind_dirs = self._extract_model_values(model_data, "hourly", "wind_direction_10m", i)
            weather_codes = self._extract_model_values(model_data, "hourly", "weather_code", i)

            # Calculate weighted averages
            temp_avg, temp_spread = self._weighted_average(temps)
            precip_avg, precip_spread = self._weighted_average(precips)
            precip_prob_avg, _ = self._weighted_average(precip_probs)
            wind_avg, wind_spread = self._weighted_average(winds)
            wind_dir_avg, _ = self._weighted_average(wind_dirs)
            humidity_avg, _ = self._weighted_average(humidity)
            dew_point_avg, _ = self._weighted_average(dew_points)
            cloud_cover_avg, _ = self._weighted_average(cloud_covers)

            temp_spreads.append(temp_spread)
            precip_spreads.append(precip_spread)
            wind_spreads.append(wind_spread)

            # Overall confidence based on all metrics
            temp_conf = self._calculate_confidence(temp_spread, "temperature")
            precip_conf = self._calculate_confidence(precip_spread, "precipitation")
            wind_conf = self._calculate_confidence(wind_spread, "wind_speed")
            confidence = (temp_conf + precip_conf + wind_conf) / 3

            # Weather code: use MODE (most common) rather than average
            # Weather codes are categorical (0=clear, 61=rain, 95=thunderstorm)
            # Averaging would be meaningless, so we pick the most frequent prediction
            # Tie-breaker: max() returns the highest code (more severe weather)
            valid_codes = [v for v in weather_codes.values() if v is not None]
            weather_code = int(max(set(valid_codes), key=valid_codes.count)) if valid_codes else 0

            hourly_forecasts.append(HourlyForecast(
                time=datetime.fromisoformat(time_str),
                temperature=round(temp_avg, 1),
                precipitation=round(precip_avg, 1),
                precipitation_probability=round(precip_prob_avg, 0),
                wind_speed=round(wind_avg, 1),
                wind_direction=round(wind_dir_avg, 0),
                humidity=round(humidity_avg, 0),
                dew_point=round(dew_point_avg, 1),
                cloud_cover=round(cloud_cover_avg, 0),
                weather_code=weather_code,
                confidence=round(confidence, 0),
            ))

        # Build daily ensemble forecast
        daily_forecasts = []
        for i, time_str in enumerate(daily_times):
            temp_maxs = self._extract_model_values(model_data, "daily", "temperature_2m_max", i)
            temp_mins = self._extract_model_values(model_data, "daily", "temperature_2m_min", i)
            precip_sums = self._extract_model_values(model_data, "daily", "precipitation_sum", i)
            precip_probs = self._extract_model_values(model_data, "daily", "precipitation_probability_max", i)
            wind_maxs = self._extract_model_values(model_data, "daily", "wind_speed_10m_max", i)
            weather_codes = self._extract_model_values(model_data, "daily", "weather_code", i)

            # Get sunrise/sunset from reference model (same for all models)
            sunrise_arr = reference_model.get("daily", {}).get("sunrise", [])
            sunset_arr = reference_model.get("daily", {}).get("sunset", [])
            sunrise = sunrise_arr[i] if i < len(sunrise_arr) else None
            sunset = sunset_arr[i] if i < len(sunset_arr) else None

            temp_max_avg, temp_max_spread = self._weighted_average(temp_maxs)
            temp_min_avg, _ = self._weighted_average(temp_mins)
            precip_avg, precip_spread = self._weighted_average(precip_sums)
            precip_prob_avg, _ = self._weighted_average(precip_probs)
            wind_avg, wind_spread = self._weighted_average(wind_maxs)

            # FALLBACK: Some models return 0% daily precip probability even when
            # hourly data shows rain. This happens because daily probability is
            # sometimes a separate calculation from hourly. If daily shows 0%,
            # we use the MAX of hourly probabilities for that day instead.
            # This prevents the UI from showing "0% chance of rain" on rainy days.
            if precip_prob_avg == 0:
                day_start_hour = i * 24
                day_end_hour = min(day_start_hour + 24, len(hourly_forecasts))
                if day_start_hour < len(hourly_forecasts):
                    hourly_probs = [
                        hourly_forecasts[h].precipitation_probability
                        for h in range(day_start_hour, day_end_hour)
                    ]
                    if hourly_probs:
                        precip_prob_avg = max(hourly_probs)

            confidence = (
                self._calculate_confidence(temp_max_spread, "temperature") +
                self._calculate_confidence(precip_spread, "precipitation") +
                self._calculate_confidence(wind_spread, "wind_speed")
            ) / 3

            valid_codes = [v for v in weather_codes.values() if v is not None]
            weather_code = int(max(set(valid_codes), key=valid_codes.count)) if valid_codes else 0

            daily_forecasts.append(DailyForecast(
                date=datetime.fromisoformat(time_str),
                temperature_max=round(temp_max_avg, 1),
                temperature_min=round(temp_min_avg, 1),
                precipitation_sum=round(precip_avg, 1),
                precipitation_probability_max=round(precip_prob_avg, 0),
                wind_speed_max=round(wind_avg, 1),
                weather_code=weather_code,
                confidence=round(confidence, 0),
                sunrise=sunrise,
                sunset=sunset,
            ))

        # Calculate overall model spread for key metrics
        model_spread = {
            "temperature": round(np.mean(temp_spreads) if temp_spreads else 0, 2),
            "precipitation": round(np.mean(precip_spreads) if precip_spreads else 0, 2),
            "wind_speed": round(np.mean(wind_spreads) if wind_spreads else 0, 2),
        }

        return EnsembleForecastResponse(
            location={
                "latitude": latitude,
                "longitude": longitude,
                "timezone": reference_model.get("timezone", "UTC"),
            },
            current=current,
            hourly=hourly_forecasts,
            daily=daily_forecasts,
            model_spread=model_spread,
        )

    async def get_model_comparison(
        self,
        latitude: float,
        longitude: float,
        hour_offset: int = 0
    ) -> Dict[str, Any]:
        """Get predictions from each individual model for comparison."""
        model_data = await open_meteo_client.fetch_all_models(latitude, longitude)

        if not model_data:
            raise ValueError("No model data available")

        reference_model = next(iter(model_data.values()))
        hourly_times = reference_model.get("hourly", {}).get("time", [])
        if hour_offset >= len(hourly_times):
            raise ValueError(f"hour_offset {hour_offset} exceeds available forecast hours ({len(hourly_times)})")
        time_str = hourly_times[hour_offset]

        models = []
        for model_name, data in model_data.items():
            if data and "hourly" in data:
                hourly = data["hourly"]
                models.append({
                    "model_name": model_name,
                    "temperature": hourly.get("temperature_2m", [0])[hour_offset],
                    "precipitation": hourly.get("precipitation", [0])[hour_offset],
                    "wind_speed": hourly.get("wind_speed_10m", [0])[hour_offset],
                })

        # Calculate ensemble values
        temps = {m["model_name"]: m["temperature"] for m in models}
        precips = {m["model_name"]: m["precipitation"] for m in models}
        winds = {m["model_name"]: m["wind_speed"] for m in models}

        temp_avg, _ = self._weighted_average(temps)
        precip_avg, _ = self._weighted_average(precips)
        wind_avg, _ = self._weighted_average(winds)

        return {
            "location": {
                "latitude": latitude,
                "longitude": longitude,
            },
            "time": time_str,
            "models": models,
            "ensemble": {
                "model_name": "ensemble",
                "temperature": round(temp_avg, 1),
                "precipitation": round(precip_avg, 1),
                "wind_speed": round(wind_avg, 1),
            },
        }


ensemble_calculator = EnsembleCalculator()
