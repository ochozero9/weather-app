from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.database import Location
from app.models.schemas import LocationCreate, LocationResponse

router = APIRouter(prefix="/locations", tags=["locations"])


@router.post("", response_model=LocationResponse)
async def create_location(
    location: LocationCreate,
    db: AsyncSession = Depends(get_db),
):
    """Save a location for quick access."""
    # Check if location already exists
    existing = await db.execute(
        select(Location).where(
            Location.latitude == location.latitude,
            Location.longitude == location.longitude,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Location already saved")

    db_location = Location(
        name=location.name,
        latitude=location.latitude,
        longitude=location.longitude,
        timezone=location.timezone,
        country=location.country,
    )
    db.add(db_location)
    await db.commit()
    await db.refresh(db_location)
    return db_location


@router.get("", response_model=list[LocationResponse])
async def list_locations(
    db: AsyncSession = Depends(get_db),
):
    """List all saved locations."""
    result = await db.execute(select(Location).order_by(Location.created_at.desc()))
    return result.scalars().all()


@router.get("/{location_id}", response_model=LocationResponse)
async def get_location(
    location_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Get a specific saved location."""
    result = await db.execute(select(Location).where(Location.id == location_id))
    location = result.scalar_one_or_none()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    return location


@router.delete("/{location_id}")
async def delete_location(
    location_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Delete a saved location."""
    result = await db.execute(select(Location).where(Location.id == location_id))
    location = result.scalar_one_or_none()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")

    await db.delete(location)
    await db.commit()
    return {"status": "deleted"}
