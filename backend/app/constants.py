"""
Domain Constants
================
Centralized configuration for weather-related algorithms.
Adjust these values to tune accuracy scoring and confidence calculations.
"""

# ============================================
# Accuracy Scoring
# ============================================

# Lead times (in hours) for which to store forecast snapshots
# These are the key verification points for accuracy tracking
LEAD_HOURS_TO_STORE = [24, 48, 72, 120, 168]

# Tolerances for accuracy calculation
# These define what error is considered "acceptable" for each metric
# Values are based on typical user expectations and industry standards
ACCURACY_TOLERANCES = {
    "temperature": 2.0,    # °C - most users notice >2°C errors
    "precipitation": 1.0,  # mm - precipitation is highly variable
    "wind_speed": 5.0,     # km/h - wind gusts make this variable
}

# ============================================
# Cache & Timing
# ============================================

# Maximum age for forecast cache in the accuracy service (1 hour)
OBSERVATION_MATCH_TOLERANCE_DAYS = 0.042  # ~1 hour in Julian days
