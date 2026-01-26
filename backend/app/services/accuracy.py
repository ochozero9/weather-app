"""
Forecast Accuracy Verification Service
=======================================

This module tracks forecast predictions and compares them against actual
observations to calculate accuracy scores for the ensemble and individual models.

Workflow:
1. When a forecast is requested, store_forecast_snapshot() saves predictions
   at key lead times (24h, 48h, 72h, 120h, 168h)
2. fetch_and_store_observations() retrieves actual weather from historical API
3. calculate_accuracy_metrics() compares predictions vs observations

Key Design Decisions:
- Only stores snapshots at discrete lead times to limit database growth
- Uses Julian day comparison for timestamp matching (SQLite-specific!)
- Non-linear accuracy scoring to penalize large errors progressively

Database Requirements:
- This service uses SQLite-specific SQL functions (julianday)
- Migration to PostgreSQL/MySQL would require query changes

Future Improvements:
- [ ] Use model accuracy to dynamically adjust ensemble weights
- [ ] Add weather code accuracy (categorical)
- [ ] Implement regional accuracy tracking
- [ ] Add accuracy decay over time visualization
"""

from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

import numpy as np
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import (
    AccuracyMetric,
    ForecastSnapshot,
    Location,
    Observation,
)
from app.models.schemas import AccuracyBadge, AccuracyResponse, ModelAccuracy
from app.services.open_meteo import open_meteo_client


class AccuracyService:
    """
    Service for tracking and calculating forecast accuracy.

    This service stores forecast snapshots and compares them against
    actual observations to measure how accurate our predictions are.
    """

    async def store_forecast_snapshot(
        self,
        db: AsyncSession,
        location_id: int,
        latitude: float,
        longitude: float,
        model_data: Dict[str, dict],
        ensemble_data: Dict[str, Any]
    ):
        """Store a forecast snapshot for later verification."""
        now = datetime.utcnow()

        # Get first model's time array as reference
        reference = next(iter(model_data.values()))
        hourly_times = reference.get("hourly", {}).get("time", [])

        # Store snapshots for key lead times (24h, 48h, 72h, etc.)
        lead_hours_to_store = [24, 48, 72, 120, 168]

        for lead_hours in lead_hours_to_store:
            if lead_hours >= len(hourly_times):
                continue

            target_time = datetime.fromisoformat(hourly_times[lead_hours])

            # Extract model values at this lead time
            temp_by_model = {}
            precip_by_model = {}
            wind_by_model = {}

            for model_name, data in model_data.items():
                if data and "hourly" in data:
                    hourly = data["hourly"]
                    temp_by_model[model_name] = hourly.get("temperature_2m", [None])[lead_hours]
                    precip_by_model[model_name] = hourly.get("precipitation", [None])[lead_hours]
                    wind_by_model[model_name] = hourly.get("wind_speed_10m", [None])[lead_hours]

            # Get ensemble values
            hourly_forecast = ensemble_data.get("hourly", [])
            if lead_hours < len(hourly_forecast):
                ensemble_hourly = hourly_forecast[lead_hours]
                temp_ensemble = ensemble_hourly.get("temperature")
                precip_ensemble = ensemble_hourly.get("precipitation")
                wind_ensemble = ensemble_hourly.get("wind_speed")
                confidence = ensemble_hourly.get("confidence")
            else:
                continue

            snapshot = ForecastSnapshot(
                location_id=location_id,
                snapshot_time=now,
                target_time=target_time,
                lead_hours=lead_hours,
                temperature_ensemble=temp_ensemble,
                precipitation_ensemble=precip_ensemble,
                wind_speed_ensemble=wind_ensemble,
                confidence_score=confidence,
                temperature_by_model=temp_by_model,
                precipitation_by_model=precip_by_model,
                wind_speed_by_model=wind_by_model,
            )
            db.add(snapshot)

        await db.commit()

    async def fetch_and_store_observations(
        self,
        db: AsyncSession,
        location: Location
    ):
        """Fetch and store actual weather observations."""
        # Fetch observations for the past 7 days
        end_date = datetime.utcnow().date()
        start_date = end_date - timedelta(days=7)

        historical = await open_meteo_client.fetch_historical_observations(
            location.latitude,
            location.longitude,
            start_date.isoformat(),
            end_date.isoformat()
        )

        if not historical or "hourly" not in historical:
            return

        hourly = historical["hourly"]
        times = hourly.get("time", [])
        temps = hourly.get("temperature_2m", [])
        precips = hourly.get("precipitation", [])
        winds = hourly.get("wind_speed_10m", [])
        codes = hourly.get("weather_code", [])

        for i, time_str in enumerate(times):
            obs_time = datetime.fromisoformat(time_str)

            # Check if we already have this observation
            existing = await db.execute(
                select(Observation).where(
                    Observation.location_id == location.id,
                    Observation.observation_time == obs_time
                )
            )
            if existing.scalar_one_or_none():
                continue

            observation = Observation(
                location_id=location.id,
                observation_time=obs_time,
                temperature=temps[i] if i < len(temps) else None,
                precipitation=precips[i] if i < len(precips) else None,
                wind_speed=winds[i] if i < len(winds) else None,
                weather_code=codes[i] if i < len(codes) else None,
            )
            db.add(observation)

        await db.commit()

    def _calculate_accuracy_score(
        self,
        predicted: float,
        actual: float,
        tolerance: float
    ) -> float:
        """
        Calculate accuracy score (0-100) based on prediction error.
        Uses a NON-LINEAR piecewise function to progressively penalize larger errors.

        Scoring Curve (for temperature with tolerance=2°C):
        - Error ≤ 1°C (0.5x tolerance): 100% (perfect zone)
        - Error 1-2°C (0.5x-1x tolerance): 100% → 75% (good zone)
        - Error 2-4°C (1x-2x tolerance): 75% → 25% (degraded zone)
        - Error > 4°C (>2x tolerance): 25% → 0% (poor zone)

        This means:
        - Small errors (within half tolerance) are forgiven completely
        - Errors up to tolerance lose 25 points
        - Errors up to 2x tolerance lose another 50 points
        - Beyond 2x tolerance, accuracy drops to 0

        The curve is intentionally generous for small errors but harsh
        for large ones, reflecting that small forecast errors are acceptable
        but large errors significantly impact user trust.

        Args:
            predicted: The forecasted value
            actual: The observed value
            tolerance: Acceptable error threshold (metric-specific)

        Returns:
            Accuracy score from 0 to 100
        """
        error = abs(predicted - actual)

        # Zone 1: Perfect (error ≤ 50% of tolerance) → 100%
        if error <= tolerance * 0.5:
            return 100.0
        # Zone 2: Good (error 50-100% of tolerance) → 100% to 75%
        elif error <= tolerance:
            return 100.0 - (error / tolerance) * 25
        # Zone 3: Degraded (error 100-200% of tolerance) → 75% to 25%
        elif error <= tolerance * 2:
            return 75.0 - ((error - tolerance) / tolerance) * 50
        # Zone 4: Poor (error > 200% of tolerance) → 25% to 0%
        else:
            return max(0, 25.0 - ((error - tolerance * 2) / tolerance) * 25)

    async def calculate_accuracy_metrics(
        self,
        db: AsyncSession,
        location_id: Optional[int] = None,
        days: int = 30
    ) -> AccuracyResponse:
        """Calculate accuracy metrics by comparing forecasts to observations."""
        cutoff_date = datetime.utcnow() - timedelta(days=days)

        # Query forecast snapshots with matching observations
        # WARNING: This uses SQLite-specific julianday() function!
        # For PostgreSQL, use: EXTRACT(EPOCH FROM ...) / 86400
        # For MySQL, use: TIMESTAMPDIFF(HOUR, ...) or TO_DAYS()
        #
        # Julian day is days since Nov 24, 4714 BC. The difference gives
        # fractional days, so 0.042 ≈ 1 hour (1/24 = 0.0417)
        # This matches forecasts to observations within ±1 hour window
        query = (
            select(ForecastSnapshot, Observation)
            .join(
                Observation,
                (ForecastSnapshot.location_id == Observation.location_id) &
                (func.abs(
                    func.julianday(ForecastSnapshot.target_time) -
                    func.julianday(Observation.observation_time)
                ) < 0.042)  # 0.042 days ≈ 1 hour tolerance
            )
            .where(ForecastSnapshot.snapshot_time >= cutoff_date)
        )

        if location_id:
            query = query.where(ForecastSnapshot.location_id == location_id)

        result = await db.execute(query)
        matches = result.all()

        if not matches:
            return AccuracyResponse(
                period=f"{days}_days",
                ensemble_accuracy=0,
                by_lead_time={},
                model_performance=[],
            )

        # Group by lead time and model
        lead_time_scores: Dict[int, List[float]] = {}
        model_scores: Dict[str, Dict[str, List[float]]] = {}
        ensemble_scores: List[float] = []

        # Tolerances for accuracy calculation
        # These define what error is considered "acceptable" for each metric
        # Values are based on typical user expectations and industry standards
        # Adjust these to change how strict/lenient accuracy scoring is
        temp_tolerance = 2.0    # °C - most users notice >2°C errors
        precip_tolerance = 1.0  # mm - precipitation is highly variable
        wind_tolerance = 5.0    # km/h - wind gusts make this variable

        for snapshot, observation in matches:
            lead = snapshot.lead_hours

            # Calculate ensemble accuracy
            if snapshot.temperature_ensemble is not None and observation.temperature is not None:
                temp_score = self._calculate_accuracy_score(
                    snapshot.temperature_ensemble,
                    observation.temperature,
                    temp_tolerance
                )

                precip_score = 100.0
                if snapshot.precipitation_ensemble is not None and observation.precipitation is not None:
                    precip_score = self._calculate_accuracy_score(
                        snapshot.precipitation_ensemble,
                        observation.precipitation,
                        precip_tolerance
                    )

                wind_score = 100.0
                if snapshot.wind_speed_ensemble is not None and observation.wind_speed is not None:
                    wind_score = self._calculate_accuracy_score(
                        snapshot.wind_speed_ensemble,
                        observation.wind_speed,
                        wind_tolerance
                    )

                overall = (temp_score + precip_score + wind_score) / 3
                ensemble_scores.append(overall)

                if lead not in lead_time_scores:
                    lead_time_scores[lead] = []
                lead_time_scores[lead].append(overall)

            # Calculate per-model accuracy
            if snapshot.temperature_by_model:
                for model_name, temp_pred in snapshot.temperature_by_model.items():
                    if temp_pred is not None and observation.temperature is not None:
                        if model_name not in model_scores:
                            model_scores[model_name] = {"temp": [], "precip": [], "wind": []}

                        model_scores[model_name]["temp"].append(
                            self._calculate_accuracy_score(temp_pred, observation.temperature, temp_tolerance)
                        )

                        if snapshot.precipitation_by_model and model_name in snapshot.precipitation_by_model:
                            precip_pred = snapshot.precipitation_by_model[model_name]
                            if precip_pred is not None and observation.precipitation is not None:
                                model_scores[model_name]["precip"].append(
                                    self._calculate_accuracy_score(precip_pred, observation.precipitation, precip_tolerance)
                                )

                        if snapshot.wind_speed_by_model and model_name in snapshot.wind_speed_by_model:
                            wind_pred = snapshot.wind_speed_by_model[model_name]
                            if wind_pred is not None and observation.wind_speed is not None:
                                model_scores[model_name]["wind"].append(
                                    self._calculate_accuracy_score(wind_pred, observation.wind_speed, wind_tolerance)
                                )

        # Compile results
        by_lead_time = {
            f"{lead}h": round(np.mean(scores), 1)
            for lead, scores in sorted(lead_time_scores.items())
        }

        model_performance = []
        for model_name, scores in model_scores.items():
            temp_acc = np.mean(scores["temp"]) if scores["temp"] else 0
            precip_acc = np.mean(scores["precip"]) if scores["precip"] else 100
            overall = (temp_acc + precip_acc) / 2

            model_performance.append(ModelAccuracy(
                model_name=model_name,
                temperature_accuracy=round(temp_acc, 1),
                precipitation_accuracy=round(precip_acc, 1),
                overall_accuracy=round(overall, 1),
                sample_count=len(scores["temp"]),
            ))

        # Sort by overall accuracy
        model_performance.sort(key=lambda x: x.overall_accuracy, reverse=True)

        return AccuracyResponse(
            period=f"{days}_days",
            ensemble_accuracy=round(np.mean(ensemble_scores), 1) if ensemble_scores else 0,
            by_lead_time=by_lead_time,
            model_performance=model_performance,
        )

    async def get_accuracy_badge(
        self,
        db: AsyncSession,
        location_id: Optional[int] = None,
        lead_hours: int = 72
    ) -> AccuracyBadge:
        """Get a simple accuracy badge for display."""
        metrics = await self.calculate_accuracy_metrics(db, location_id, days=30)

        lead_key = f"{lead_hours}h"
        accuracy = metrics.by_lead_time.get(lead_key, 0) if metrics.by_lead_time else 0

        if accuracy > 0:
            text = f"{int(accuracy)}% accurate for {lead_hours}h forecasts"
        else:
            text = "Collecting accuracy data..."

        return AccuracyBadge(
            text=text,
            accuracy=accuracy,
            sample_count=sum(m.sample_count for m in metrics.model_performance) if metrics.model_performance else 0,
            lead_hours=lead_hours,
        )


accuracy_service = AccuracyService()
