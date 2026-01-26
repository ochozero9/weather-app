from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.schemas import AccuracyBadge, AccuracyResponse
from app.services.accuracy import accuracy_service

router = APIRouter(prefix="/accuracy", tags=["accuracy"])


@router.get("", response_model=AccuracyResponse)
async def get_accuracy_metrics(
    location_id: Optional[int] = Query(None, description="Filter by location"),
    days: int = Query(30, ge=7, le=90, description="Days to analyze"),
    db: AsyncSession = Depends(get_db),
):
    """
    Get accuracy metrics for forecast verification.

    Returns:
    - Overall ensemble accuracy
    - Accuracy by lead time (24h, 48h, 72h, etc.)
    - Per-model performance comparison
    """
    return await accuracy_service.calculate_accuracy_metrics(db, location_id, days)


@router.get("/badge", response_model=AccuracyBadge)
async def get_accuracy_badge(
    location_id: Optional[int] = Query(None, description="Filter by location"),
    lead_hours: int = Query(72, description="Lead time to display"),
    db: AsyncSession = Depends(get_db),
):
    """
    Get a simple accuracy badge for UI display.

    Returns a formatted text like "94% accurate for 72h forecasts"
    """
    return await accuracy_service.get_accuracy_badge(db, location_id, lead_hours)


@router.get("/models")
async def get_model_accuracy(
    days: int = Query(30, ge=7, le=90, description="Days to analyze"),
    db: AsyncSession = Depends(get_db),
):
    """
    Get detailed accuracy metrics for each weather model.

    Useful for understanding which models perform best in your area.
    """
    metrics = await accuracy_service.calculate_accuracy_metrics(db, None, days)
    return {
        "period": metrics.period,
        "models": [
            {
                "name": m.model_name,
                "temperature_accuracy": m.temperature_accuracy,
                "precipitation_accuracy": m.precipitation_accuracy,
                "overall_accuracy": m.overall_accuracy,
                "sample_count": m.sample_count,
            }
            for m in metrics.model_performance
        ]
    }
