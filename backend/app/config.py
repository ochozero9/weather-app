from typing import Dict, List
from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    app_name: str = "Weather Ensemble API"
    database_url: str = f"sqlite+aiosqlite:///{Path(__file__).parent.parent}/weather.db"
    open_meteo_base_url: str = "https://api.open-meteo.com/v1"

    # Forecast snapshot interval in hours
    snapshot_interval_hours: int = 6

    # Weather models to fetch from Open-Meteo
    weather_models: List[str] = [
        "gfs_seamless",      # GFS (NOAA)
        "ecmwf_ifs04",       # ECMWF
        "icon_seamless",     # ICON (DWD)
        "gem_seamless",      # GEM (Canada)
        "jma_seamless",      # JMA (Japan)
        "meteofrance_seamless"  # Meteo-France
    ]

    # Default model weights (will be updated based on accuracy)
    default_model_weights: Dict[str, float] = {
        "gfs_seamless": 1.0,
        "ecmwf_ifs04": 1.2,  # ECMWF typically more accurate
        "icon_seamless": 1.0,
        "gem_seamless": 0.9,
        "jma_seamless": 0.9,
        "meteofrance_seamless": 1.0
    }

    class Config:
        env_file = ".env"


settings = Settings()
