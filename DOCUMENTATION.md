# Weather App - Complete Documentation

> **Repository**: https://github.com/ochozero9/weather-app
> **Last Updated**: January 2026
> **Stack**: Python/FastAPI + React/TypeScript + SQLite

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Setup Instructions](#setup-instructions)
6. [Backend Documentation](#backend-documentation)
7. [Frontend Documentation](#frontend-documentation)
8. [API Reference](#api-reference)
9. [Database Schema](#database-schema)
10. [Configuration](#configuration)
11. [Theming](#theming)
12. [Performance Optimizations](#performance-optimizations)
13. [Known Limitations](#known-limitations)
14. [Future Improvements](#future-improvements)

---

## Overview

A weather forecasting application that combines predictions from **6 different weather models** into a single ensemble forecast. The ensemble approach improves accuracy by averaging out individual model biases and provides confidence scores based on model agreement.

### Key Differentiators

- **Multi-Model Ensemble**: Combines GFS, ECMWF, ICON, GEM, JMA, and Meteo-France models
- **Confidence Scoring**: Shows how much models agree (high agreement = high confidence)
- **Accuracy Tracking**: Stores forecasts and verifies against actual observations
- **Multiple Themes**: Default, Futuristic (dark), Glass (frosted), OLED (pure black)
- **4 Icon Styles**: Emoji, Weather Icons, Meteocons, Filled SVG
- **Offline Support**: Service worker caches static assets

---

## Features

### Weather Data Displayed

| Data Type | Metrics Shown |
|-----------|---------------|
| **Current** | Temperature, feels-like, humidity, wind speed/direction, precipitation, UV index, visibility, air quality (AQI) |
| **Hourly** | 7 days of temperature, precipitation probability, wind, cloud cover, dew point, confidence score |
| **Daily** | 7 days of min/max temperature, precipitation sum, wind max, sunrise/sunset, confidence score |
| **Model Spread** | Temperature, precipitation, and wind speed uncertainty (standard deviation across models) |

### User Settings

| Setting | Options | Default |
|---------|---------|---------|
| Temperature Unit | Celsius, Fahrenheit | Celsius |
| Theme | Default, Futuristic, Glass, OLED | Default |
| Icon Style | Emoji, wiIcons, Meteocons, Filled | wiIcons |
| Remember Location | On/Off | On |
| Recent Locations | On/Off (up to 5 saved) | Off |
| Quick Location Switch | On/Off | On |
| Show Refresh Button | On/Off | Off |

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `C` | Switch to Celsius |
| `F` | Switch to Fahrenheit |

---

## Technology Stack

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.10+ | Runtime |
| FastAPI | 0.109.0 | Web framework |
| Uvicorn | 0.27.0 | ASGI server |
| SQLAlchemy | 2.0.25 | ORM |
| aiosqlite | 0.19.0 | Async SQLite driver |
| httpx | 0.26.0 | Async HTTP client |
| Pydantic | 2.5.3 | Data validation |
| NumPy | 1.26.3 | Numerical computations |
| APScheduler | 3.10.4 | Background tasks |

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2.0 | UI framework |
| TypeScript | 5.9.3 | Type safety |
| Vite | 7.2.4 | Build tool |
| react-icons | 5.5.0 | Icon library |

### External APIs

| API | Purpose | Documentation |
|-----|---------|---------------|
| Open-Meteo Forecast | Weather predictions | https://open-meteo.com/en/docs |
| Open-Meteo Geocoding | Location search | https://open-meteo.com/en/docs/geocoding-api |
| Open-Meteo Air Quality | AQI data | https://open-meteo.com/en/docs/air-quality-api |
| Zippopotam.us | ZIP code lookup | https://www.zippopotam.us |

---

## Project Structure

```
weather-app/
├── .gitignore
├── DOCUMENTATION.md          # This file
│
├── backend/
│   ├── requirements.txt      # Python dependencies
│   ├── weather.db            # SQLite database (created on first run)
│   └── app/
│       ├── __init__.py
│       ├── main.py           # FastAPI app, CORS, routes registration
│       ├── config.py         # Settings, model weights
│       ├── database.py       # SQLAlchemy async setup
│       │
│       ├── models/
│       │   ├── __init__.py
│       │   ├── database.py   # ORM models (Location, ForecastSnapshot, etc.)
│       │   └── schemas.py    # Pydantic request/response schemas
│       │
│       ├── services/
│       │   ├── __init__.py
│       │   ├── open_meteo.py # External API client
│       │   ├── ensemble.py   # Weighted averaging, confidence calculation
│       │   └── accuracy.py   # Forecast verification
│       │
│       └── api/
│           ├── __init__.py
│           └── routes/
│               ├── __init__.py
│               ├── forecast.py   # /api/forecast endpoints
│               ├── locations.py  # /api/locations endpoints
│               └── accuracy.py   # /api/accuracy endpoints
│
└── frontend/
    ├── package.json
    ├── package-lock.json
    ├── vite.config.ts        # Build configuration
    ├── tsconfig.json
    ├── index.html
    │
    ├── public/
    │   ├── sw.js             # Service worker
    │   ├── manifest.json     # PWA manifest
    │   └── *.png             # App icons
    │
    └── src/
        ├── main.tsx          # React entry point
        ├── App.tsx           # Main component
        ├── App.css           # Main styles + default theme
        ├── index.css         # Global styles
        │
        ├── api/
        │   └── client.ts     # API client functions
        │
        ├── types/
        │   └── weather.ts    # TypeScript interfaces
        │
        ├── hooks/
        │   └── useWeather.ts # Weather data hook
        │
        ├── constants/
        │   └── weather.ts    # Constants (snow codes, conversions)
        │
        ├── utils/
        │   ├── storage.ts    # localStorage management
        │   ├── weather.ts    # Utilities (temp conversion)
        │   └── preload.ts    # Lazy loading helpers
        │
        ├── components/
        │   ├── CurrentWeather.tsx
        │   ├── UnifiedWeather.tsx
        │   ├── HourlyGraph.tsx
        │   ├── DailyForecast.tsx
        │   ├── TimelineDial.tsx
        │   ├── LocationSearch.tsx
        │   ├── LocationSelector.tsx
        │   ├── WeatherIcon.tsx
        │   ├── AccuracyBadge.tsx
        │   ├── ModelComparison.tsx   # Lazy loaded
        │   ├── Settings.tsx          # Lazy loaded
        │   ├── PasswordGate.tsx
        │   ├── Settings.css
        │   └── ModelComparison.css
        │
        └── styles/
            ├── theme-futuristic.css
            ├── theme-glass.css
            └── theme-oled.css
```

---

## Setup Instructions

### Prerequisites

- Python 3.10 or higher
- Node.js 18 or higher
- npm 9 or higher

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at `http://localhost:8000`

- API docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Production Build

```bash
# Frontend
cd frontend
npm run build
# Output in frontend/dist/

# Backend (no build needed, just run with production settings)
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Network Access

To access from other devices on your network:

1. Backend already listens on `0.0.0.0:8000`
2. Frontend dev server listens on all interfaces (`host: true` in vite.config.ts)
3. Access via your machine's local IP (e.g., `http://192.168.1.100:5173`)

---

## Backend Documentation

### Services

#### EnsembleCalculator (`services/ensemble.py`)

Combines predictions from 6 weather models using weighted averaging.

**Model Weights** (configured in `config.py`):
| Model | Source | Weight |
|-------|--------|--------|
| gfs_seamless | NOAA (USA) | 1.0 |
| ecmwf_ifs04 | ECMWF (Europe) | 1.2 |
| icon_seamless | DWD (Germany) | 1.0 |
| gem_seamless | Canada | 0.9 |
| jma_seamless | Japan | 0.9 |
| meteofrance_seamless | France | 1.0 |

**Confidence Calculation**:
```
confidence = 100 × e^(-spread / typical_spread)
```

| Metric | Typical Spread | At Typical = |
|--------|----------------|--------------|
| Temperature | 3°C | ~37% confidence |
| Precipitation | 5mm | ~37% confidence |
| Wind Speed | 5km/h | ~37% confidence |

#### AccuracyService (`services/accuracy.py`)

Tracks forecast accuracy by comparing predictions to observations.

**Accuracy Scoring** (non-linear):
| Error Range | Score |
|-------------|-------|
| ≤ 0.5× tolerance | 100% |
| 0.5-1× tolerance | 100% → 75% |
| 1-2× tolerance | 75% → 25% |
| > 2× tolerance | 25% → 0% |

**Tolerances**:
- Temperature: 2°C
- Precipitation: 1mm
- Wind: 5 km/h

#### OpenMeteoClient (`services/open_meteo.py`)

Async HTTP client for all external API calls.

**Timeouts**:
- Forecast requests: 30 seconds
- Other requests: 10 seconds

---

## Frontend Documentation

### Components

#### WeatherIcon

Renders weather icons in 4 different styles.

```tsx
<WeatherIcon
  code={0}           // WMO weather code (0-99)
  style="meteocons"  // 'emoji' | 'wiIcons' | 'meteocons' | 'filled'
  size={48}          // Size in pixels
  time="2025-01-26T19:00:00"  // Optional: for day/night detection
/>
```

#### LocationSearch

Autocomplete search with debouncing and request cancellation.

```tsx
<LocationSearch
  onLocationSelect={(location) => handleSelect(location)}
  initialValue=""
  placeholder="Search city or zip code..."
  usePortal={true}  // Render dropdown at document root
/>
```

**Patterns**:
- 300ms debounce on typing
- AbortController cancels in-flight requests
- Keyboard navigation (↑↓ Enter Escape)

#### HourlyGraph

SVG chart showing hourly forecast data.

**Layout**:
- Fixed 60px width per hour (scrollable)
- Bezier curves for smooth lines (tension: 0.3)
- Precipitation bars at bottom
- Division-by-zero protection on scale functions

### Hooks

#### useWeather

```tsx
const {
  forecast,           // EnsembleForecast | null
  savedLocations,     // Location[]
  loading,            // boolean
  error,              // string | null
  fetchForecast,      // (lat, lon) => Promise<void>
  refreshSavedLocations  // () => Promise<void>
} = useWeather();
```

**Features**:
- Soft loading (keeps old data during refetch)
- Preserves data on error (graceful degradation)
- Auto-fetches saved locations on mount

### Storage Keys

All localStorage keys prefixed with `weather-app-`:

| Key | Type | Default |
|-----|------|---------|
| `weather-app-theme` | string | 'default' |
| `weather-app-unit` | 'C' \| 'F' | 'C' |
| `weather-app-icon-style` | string | 'wiIcons' |
| `weather-app-remember-location` | boolean | true |
| `weather-app-show-recent` | boolean | false |
| `weather-app-quick-switch` | boolean | true |
| `weather-app-show-refresh` | boolean | false |
| `weather-app-recent-locations` | JSON | [] |
| `weather-app-last-location` | JSON | null |

---

## API Reference

### Forecast Endpoints

#### GET /api/forecast

Get ensemble weather forecast.

**Parameters**:
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| lat | float | Yes | Latitude (-90 to 90) |
| lon | float | Yes | Longitude (-180 to 180) |

**Response**: `EnsembleForecastResponse`
```json
{
  "location": { "latitude": 40.7, "longitude": -74.0, "timezone": "America/New_York" },
  "current": { "temperature": 22.5, "humidity": 65, ... },
  "hourly": [ { "time": "...", "temperature": 22.5, "confidence": 85, ... }, ... ],
  "daily": [ { "date": "...", "temperature_max": 28, "confidence": 80, ... }, ... ],
  "model_spread": { "temperature": 1.2, "precipitation": 2.5, "wind_speed": 3.1 }
}
```

#### GET /api/forecast/models

Get individual model predictions for comparison.

**Parameters**:
| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| lat | float | Yes | - | Latitude |
| lon | float | Yes | - | Longitude |
| hour_offset | int | No | 0 | Hours from now (0-168) |

#### GET /api/forecast/geocode

Search for locations.

**Parameters**:
| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| query | string | Yes | - | City name or ZIP code |
| limit | int | No | 5 | Max results (1-10) |

**Supported Formats**:
- City names: "New York", "London", "東京"
- US ZIP: "10001", "90210-1234"
- Canadian postal: "M5V 3A8"
- UK postcode: "SW1A 1AA"

### Location Endpoints

#### POST /api/locations

Save a location.

**Body**:
```json
{
  "name": "New York",
  "latitude": 40.7128,
  "longitude": -74.006,
  "timezone": "America/New_York",
  "country": "United States"
}
```

#### GET /api/locations

List all saved locations.

#### DELETE /api/locations/{id}

Delete a saved location.

### Accuracy Endpoints

#### GET /api/accuracy

Get detailed accuracy metrics.

**Parameters**:
| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| location_id | int | No | - | Filter by location |
| days | int | No | 30 | Period (7-90) |

#### GET /api/accuracy/badge

Get simple accuracy badge text.

**Response**:
```json
{
  "text": "94% accurate for 72h forecasts",
  "accuracy": 94.2,
  "sample_count": 156,
  "lead_hours": 72
}
```

---

## Database Schema

### Tables

#### locations
```sql
CREATE TABLE locations (
  id INTEGER PRIMARY KEY,
  name VARCHAR(255),
  latitude FLOAT NOT NULL,
  longitude FLOAT NOT NULL,
  timezone VARCHAR(100) NOT NULL,
  country VARCHAR(100),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### forecast_snapshots
```sql
CREATE TABLE forecast_snapshots (
  id INTEGER PRIMARY KEY,
  location_id INTEGER REFERENCES locations(id),
  snapshot_time DATETIME,
  target_time DATETIME,
  lead_hours INTEGER,
  temperature_ensemble FLOAT,
  precipitation_ensemble FLOAT,
  wind_speed_ensemble FLOAT,
  confidence_score FLOAT,
  temperature_by_model JSON,
  precipitation_by_model JSON,
  wind_speed_by_model JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### observations
```sql
CREATE TABLE observations (
  id INTEGER PRIMARY KEY,
  location_id INTEGER REFERENCES locations(id),
  observation_time DATETIME NOT NULL,
  temperature FLOAT,
  precipitation FLOAT,
  wind_speed FLOAT,
  weather_code INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### accuracy_metrics
```sql
CREATE TABLE accuracy_metrics (
  id INTEGER PRIMARY KEY,
  location_id INTEGER REFERENCES locations(id),  -- NULL for global
  model_name VARCHAR(100),
  lead_hours INTEGER NOT NULL,
  temperature_accuracy FLOAT,
  precipitation_accuracy FLOAT,
  wind_speed_accuracy FLOAT,
  overall_accuracy FLOAT,
  sample_count INTEGER,
  period_start DATETIME,
  period_end DATETIME,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## Configuration

### Backend Configuration (`config.py`)

```python
class Settings:
    app_name = "Weather Ensemble API"
    database_url = "sqlite+aiosqlite:///./weather.db"
    open_meteo_base_url = "https://api.open-meteo.com/v1"
    snapshot_interval_hours = 6

    default_model_weights = {
        "gfs_seamless": 1.0,
        "ecmwf_ifs04": 1.2,      # Highest weight
        "icon_seamless": 1.0,
        "gem_seamless": 0.9,
        "jma_seamless": 0.9,
        "meteofrance_seamless": 1.0,
    }
```

### Frontend Configuration (`vite.config.ts`)

```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,    // Listen on all interfaces
    port: 5173,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-icons': ['react-icons'],
        },
      },
    },
  },
});
```

---

## Theming

### CSS Variables

All themes override these root variables:

```css
:root {
  --primary-color: #2563eb;
  --primary-dark: #1d4ed8;
  --bg-color: #f8fafc;
  --card-bg: #ffffff;
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --border-color: #e2e8f0;
  --shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 4px 6px rgba(0, 0, 0, 0.1);

  /* Confidence colors */
  --confidence-high: #3b82f6;      /* 75-100% */
  --confidence-mid-high: #22c55e;  /* 50-75% */
  --confidence-mid-low: #f59e0b;   /* 25-50% */
  --confidence-low: #ef4444;       /* 0-25% */
}
```

### Theme Files

| Theme | File | Description |
|-------|------|-------------|
| Default | `App.css` | Light blue, clean |
| Futuristic | `theme-futuristic.css` | Dark blue, cyan neon |
| Glass | `theme-glass.css` | Light, frosted glass cards |
| OLED | `theme-oled.css` | Pure black background |

---

## Performance Optimizations

### Bundle Splitting

| Chunk | Contents | Size (gzip) |
|-------|----------|-------------|
| index.js | Main app | 82.6 KB |
| vendor-react.js | React, ReactDOM | 4.1 KB |
| vendor-icons.js | react-icons | 1.1 KB |
| Settings.js | Settings panel | 2.5 KB |
| ModelComparison.js | Model comparison | 0.9 KB |

### Lazy Loading

- `Settings` component loads on first settings open
- `ModelComparison` component loads when expanded
- Preload on hover (see `utils/preload.ts`)

### Service Worker

- Caches static assets (JS, CSS, fonts)
- Stale-while-revalidate strategy
- Network-first for HTML
- Skips API calls (always fresh)

---

## Known Limitations

### Backend

1. **SQLite-specific queries**: Uses `julianday()` for timestamp comparison. Migration to PostgreSQL/MySQL requires query changes.

2. **Static model weights**: Weights are hardcoded. Should be dynamic based on accuracy data.

3. **ZIP code detection**: Loose pattern matching may have false positives (e.g., German PLZ detected as US ZIP).

### Frontend

1. **Mobile detection**: Uses `window.innerWidth` at mount only. Doesn't respond to resize/rotation.

2. **API URL assumption**: Expects backend on same hostname, port 8000. Needs environment variable for production.

3. **Client-side password**: PasswordGate is not secure - password visible in source code.

4. **No error boundaries**: React errors can crash entire app.

---

## Future Improvements

### Critical
- [ ] Add comprehensive test suite (pytest, vitest)
- [ ] Add React error boundaries
- [ ] Environment variables for configuration

### High Priority
- [ ] Database migrations (Alembic)
- [ ] Input validation on frontend (Zod)
- [ ] Structured logging
- [ ] API rate limiting

### Medium Priority
- [ ] Dynamic model weights based on accuracy
- [ ] Database portability layer
- [ ] CI/CD pipeline (GitHub Actions)

### Nice to Have
- [ ] PWA offline forecast caching
- [ ] Push notifications for weather alerts
- [ ] Widget support
- [ ] Historical weather comparison

---

## Debugging Tips

### Backend

```bash
# Check API health
curl http://localhost:8000/health

# View API documentation
open http://localhost:8000/docs

# Check database
sqlite3 backend/weather.db ".tables"
sqlite3 backend/weather.db "SELECT * FROM locations;"

# Run with debug logging
LOG_LEVEL=debug uvicorn app.main:app --reload
```

### Frontend

```bash
# Check build for errors
npm run build

# Run linter
npm run lint

# Check bundle size
npm run build && ls -la dist/assets/

# Clear localStorage (in browser console)
localStorage.clear()
```

### Common Issues

| Issue | Solution |
|-------|----------|
| CORS errors | Backend must run on same hostname as frontend |
| "Unable to connect" | Check backend is running on port 8000 |
| Blank screen | Check browser console for React errors |
| Stale data | Clear localStorage and refresh |
| "No model data" | Open-Meteo API may be down, check status |

---

## License

Private repository. All rights reserved.

---

*Generated with the assistance of Claude Opus 4.5*
