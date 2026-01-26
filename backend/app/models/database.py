from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship

from app.database import Base


class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    timezone = Column(String(100), nullable=False)
    country = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)

    forecast_snapshots = relationship("ForecastSnapshot", back_populates="location")
    observations = relationship("Observation", back_populates="location")


class ForecastSnapshot(Base):
    """Stores forecast predictions for later verification."""
    __tablename__ = "forecast_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False)
    snapshot_time = Column(DateTime, nullable=False)  # When forecast was made
    target_time = Column(DateTime, nullable=False)    # What time was forecasted
    lead_hours = Column(Integer, nullable=False)       # Hours ahead of prediction

    # Ensemble forecast values
    temperature_ensemble = Column(Float)
    precipitation_ensemble = Column(Float)
    wind_speed_ensemble = Column(Float)
    confidence_score = Column(Float)  # 0-100

    # Raw model predictions (JSON: {model_name: value})
    temperature_by_model = Column(JSON)
    precipitation_by_model = Column(JSON)
    wind_speed_by_model = Column(JSON)

    created_at = Column(DateTime, default=datetime.utcnow)

    location = relationship("Location", back_populates="forecast_snapshots")


class Observation(Base):
    """Actual weather observations for verification."""
    __tablename__ = "observations"

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False)
    observation_time = Column(DateTime, nullable=False)

    temperature = Column(Float)
    precipitation = Column(Float)
    wind_speed = Column(Float)
    weather_code = Column(Integer)

    created_at = Column(DateTime, default=datetime.utcnow)

    location = relationship("Location", back_populates="observations")


class AccuracyMetric(Base):
    """Pre-calculated accuracy scores."""
    __tablename__ = "accuracy_metrics"

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=True)  # Null = global
    model_name = Column(String(100), nullable=False)  # "ensemble" or specific model
    lead_hours = Column(Integer, nullable=False)  # 24, 48, 72, etc.

    # Accuracy scores (0-100)
    temperature_accuracy = Column(Float)
    precipitation_accuracy = Column(Float)
    wind_speed_accuracy = Column(Float)
    overall_accuracy = Column(Float)

    # Sample size
    sample_count = Column(Integer, default=0)

    # Time range
    period_start = Column(DateTime)
    period_end = Column(DateTime)

    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
