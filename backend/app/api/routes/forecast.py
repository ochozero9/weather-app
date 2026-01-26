from fastapi import APIRouter, HTTPException, Query

from app.models.schemas import EnsembleForecastResponse
from app.services.ensemble import ensemble_calculator
from app.services.open_meteo import open_meteo_client

router = APIRouter(prefix="/forecast", tags=["forecast"])


@router.get("", response_model=EnsembleForecastResponse)
async def get_ensemble_forecast(
    lat: float = Query(..., ge=-90, le=90, description="Latitude"),
    lon: float = Query(..., ge=-180, le=180, description="Longitude"),
):
    """
    Get ensemble weather forecast combining multiple models.

    The forecast includes:
    - Current conditions
    - Hourly forecast for 7 days
    - Daily forecast for 7 days
    - Confidence scores based on model agreement
    - Model spread metrics
    """
    try:
        forecast = await ensemble_calculator.get_ensemble_forecast(lat, lon)
        return forecast
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch forecast: {str(e)}")


@router.get("/models")
async def get_model_comparison(
    lat: float = Query(..., ge=-90, le=90, description="Latitude"),
    lon: float = Query(..., ge=-180, le=180, description="Longitude"),
    hour_offset: int = Query(0, ge=0, le=168, description="Hours from now"),
):
    """
    Get individual model predictions for comparison.

    Returns predictions from each weather model along with the ensemble average.
    """
    try:
        comparison = await ensemble_calculator.get_model_comparison(lat, lon, hour_offset)
        return comparison
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch model data: {str(e)}")


def is_zip_code(query: str) -> bool:
    """
    Check if query looks like a zip/postal code.

    LIMITATIONS - This detection is intentionally loose and may have false positives:
    - "12345" could be a US ZIP or a street number
    - UK detection is very loose (any alphanumeric mix 5+ chars)
    - German PLZ (5 digits) will match as US ZIP
    - French codes (5 digits) will match as US ZIP

    The fallback behavior is to also search by name, so false positives
    will still return results (just with an extra ZIP lookup attempt).

    Supported formats:
    - US: 12345, 12345-6789
    - Canada: A1A 1A1, A1A1A1
    - UK: SW1A 1AA, M1 1AA, etc. (loose match)
    """
    clean = query.strip().replace(" ", "").replace("-", "")
    # US zip (5 digits or 5+4)
    if clean.isdigit() and len(clean) in (5, 9):
        return True
    # Canadian postal code (letter-digit pattern)
    if len(clean) == 6 and clean[0].isalpha():
        return True
    # UK postcode (various formats, starts with letters)
    # WARNING: This is a very loose check and may match other formats
    if len(clean) >= 5 and clean[:2].replace(" ", "")[0].isalpha():
        # Check if it matches UK pattern loosely
        has_digits = any(c.isdigit() for c in clean)
        has_letters = any(c.isalpha() for c in clean)
        if has_digits and has_letters:
            return True
    return False


def get_country_from_zip(query: str) -> str:
    """
    Guess country code from zip/postal code format.

    Returns ISO 3166-1 alpha-2 country code for use with Zippopotam.us API.

    NOTE: This is a best-effort guess based on format. It cannot distinguish:
    - German PLZ from US ZIP (both 5 digits)
    - French codes from US ZIP (both 5 digits)

    For ambiguous formats, defaults to US which has the largest user base.

    Future: Could use IP geolocation or user preference to improve accuracy.
    """
    clean = query.strip().replace(" ", "").replace("-", "")
    # US: 5 or 9 digits
    if clean.isdigit() and len(clean) in (5, 9):
        return "us"
    # Canada: alternating letter-digit (A1A1A1)
    if len(clean) == 6 and all(
        clean[i].isalpha() if i % 2 == 0 else clean[i].isdigit()
        for i in range(6)
    ):
        return "ca"
    # UK: various formats (alphanumeric mix)
    if any(c.isalpha() for c in clean) and any(c.isdigit() for c in clean):
        return "gb"
    # Default to US for ambiguous formats
    return "us"


@router.get("/geocode")
async def geocode_location(
    query: str = Query(..., min_length=2, description="Location search query (city name or zip code)"),
    limit: int = Query(5, ge=1, le=10, description="Maximum results"),
):
    """
    Search for locations by name or zip/postal code.

    Supports:
    - City names (e.g., "New York", "London")
    - US zip codes (e.g., "10001", "90210")
    - Canadian postal codes (e.g., "M5V 3A8")
    - UK postcodes (e.g., "SW1A 1AA")

    Returns matching locations with coordinates for use in forecast queries.
    """
    results = []

    # Check if query looks like a zip/postal code
    if is_zip_code(query):
        country = get_country_from_zip(query)
        zip_result = await open_meteo_client.geocode_zip(query.replace(" ", ""), country)
        if zip_result:
            results.append(zip_result)

    # Also search by name (in case zip code is also a place name, or zip lookup failed)
    name_results = await open_meteo_client.geocode(query, limit)

    for r in name_results:
        results.append({
            "name": r.get("name"),
            "latitude": r.get("latitude"),
            "longitude": r.get("longitude"),
            "country": r.get("country"),
            "admin1": r.get("admin1"),  # State/Province
            "timezone": r.get("timezone"),
        })

    # Remove duplicates based on coordinates (within 0.01 degrees)
    unique_results = []
    seen_coords = set()
    for r in results:
        coord_key = (round(r["latitude"], 2), round(r["longitude"], 2))
        if coord_key not in seen_coords:
            seen_coords.add(coord_key)
            unique_results.append(r)

    return {"results": unique_results[:limit]}
