"""
Domain Constants
================
Centralized configuration for weather-related algorithms.
Adjust these values to tune accuracy scoring and confidence calculations.

WARNING: These values affect accuracy calculations stored in the database.
Changing them will affect historical comparisons. Consider migration if modifying.
"""

# ============================================
# Accuracy Scoring
# ============================================

# Lead times (in hours) for which to store forecast snapshots.
# These are the key verification points for accuracy tracking.
#
# Rationale for selected intervals:
# - 24h: Next-day forecast (most commonly used by users)
# - 48h: 2-day forecast (still highly reliable)
# - 72h: 3-day forecast (industry standard "extended" boundary)
# - 120h: 5-day forecast (medium-range, accuracy starts to degrade)
# - 168h: 7-day forecast (long-range, useful for trend verification)
#
# NOTE: Adding more lead times increases database storage significantly.
# Each forecast request generates one snapshot row per lead time.
LEAD_HOURS_TO_STORE = [24, 48, 72, 120, 168]

# Tolerances for accuracy calculation.
# These define what error is considered "acceptable" for each metric.
# Scores degrade progressively beyond these thresholds.
#
# Values are based on typical user expectations and industry standards:
# - Temperature: ±2°C is the threshold most users notice as "wrong"
# - Precipitation: ±1mm matters for light rain vs dry, but heavy rain varies more
# - Wind speed: ±5 km/h accounts for natural gust variability
#
# Regional tuning: Consider tightening for coastal/stable climates,
# loosening for mountain/variable climates.
ACCURACY_TOLERANCES = {
    "temperature": 2.0,    # °C - most users notice >2°C errors
    "precipitation": 1.0,  # mm - precipitation is highly variable
    "wind_speed": 5.0,     # km/h - wind gusts make this variable
}

# ============================================
# Cache & Timing
# ============================================

# Tolerance for matching forecast target_time to observation_time.
# Used in SQL: WHERE ABS(julianday(target) - julianday(observation)) < tolerance
#
# 0.042 Julian days ≈ 1 hour (1/24 = 0.0417)
# This allows forecast for "3pm" to match observation from "2:30pm" or "3:45pm"
#
# DATABASE NOTE: julianday() is SQLite-specific. For PostgreSQL migration,
# use: EXTRACT(EPOCH FROM (target_time - observation_time)) / 3600 < 1
OBSERVATION_MATCH_TOLERANCE_DAYS = 0.042  # ~1 hour in Julian days
