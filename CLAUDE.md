# Weather App - Project Reference

> This document serves as context for Claude when working on this project.
> Last updated: 2026-02-01

## Project Overview

A multi-model ensemble weather forecasting app with accuracy tracking. The frontend fetches weather data directly from Open-Meteo APIs and processes it in the browser (serverless architecture). The backend handles accuracy verification by storing forecast snapshots and comparing them against actual observations.

### Tech Stack

**Frontend** (`/frontend`)
- React 19 + TypeScript
- Vite for bundling
- No state management library (useState + custom hooks)
- CSS modules (no Tailwind)
- Tauri for desktop builds

**Backend** (`/backend`)
- Python + FastAPI
- SQLAlchemy async with SQLite
- Open-Meteo API integration

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  ┌─────────────┐    ┌──────────────┐    ┌───────────────┐  │
│  │ App.tsx     │───▶│ useWeather   │───▶│ api/client.ts │  │
│  │ (state mgmt)│    │ (data hook)  │    │ (API calls)   │  │
│  └─────────────┘    └──────────────┘    └───────┬───────┘  │
│                                                   │          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              services/                               │   │
│  │  ┌─────────────┐         ┌──────────────────┐      │   │
│  │  │ openMeteo.ts│ ◀──────▶│ ensemble.ts      │      │   │
│  │  │ (API fetch) │         │ (weighted avg)   │      │   │
│  │  └─────────────┘         └──────────────────┘      │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ Direct API calls (no backend for forecasts)
┌─────────────────────────────────────────────────────────────┐
│                    External APIs                             │
│  • api.open-meteo.com (forecasts from 6 models)             │
│  • geocoding-api.open-meteo.com (location search)           │
│  • air-quality-api.open-meteo.com (AQI data)                │
│  • archive-api.open-meteo.com (historical observations)     │
│  • api.zippopotam.us (ZIP code lookup)                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Backend (accuracy only)                   │
│  ┌─────────────────┐    ┌────────────────────────────────┐ │
│  │ routes/         │───▶│ services/accuracy.py           │ │
│  │ accuracy.py     │    │ (forecast vs observation)      │ │
│  │ locations.py    │    └────────────────────────────────┘ │
│  └─────────────────┘                                        │
└─────────────────────────────────────────────────────────────┘
```

## Key Design Decisions

### Frontend

1. **Serverless Architecture**: Frontend fetches directly from Open-Meteo. Backend only handles accuracy tracking. This reduces latency and server costs.

2. **Stale-While-Revalidate**: Shows cached data immediately on app load, then fetches fresh data in background. Better perceived performance.

3. **Graceful Degradation**: On API errors, keeps showing old data rather than blank screen. Stale weather data is better than no data.

4. **Request Deduplication**: In-flight request tracking prevents duplicate API calls when React strict mode double-mounts or user rapidly interacts.

5. **Ensemble Forecasting**: Combines 6 weather models (GFS, ECMWF, ICON, GEM, JMA, Meteo-France) with weighted averaging based on historical accuracy.

### Backend

1. **SQLite with Julian Day**: Uses `julianday()` for timestamp matching. PostgreSQL migration would require query changes.

2. **Selective Snapshots**: Only stores forecasts at key lead times (24h, 48h, 72h, 120h, 168h) to limit database growth.

3. **Non-Linear Accuracy Scoring**: Progressively penalizes larger errors. Small errors (within tolerance) score ~100%, large errors degrade to 0%.

## Important Files

### Frontend

| File | Purpose |
|------|---------|
| `src/App.tsx` | Main component, state management, routing |
| `src/hooks/useWeather.ts` | Data fetching, caching, loading states |
| `src/api/client.ts` | API calls, request deduplication, model caching |
| `src/services/ensemble.ts` | Weighted averaging of weather models |
| `src/services/openMeteo.ts` | Raw API calls to Open-Meteo |
| `src/utils/storage.ts` | localStorage persistence |
| `src/constants/weather.ts` | WMO weather codes, conversions |
| `src/components/HourlyGraph.tsx` | SVG chart with bezier curves |
| `src/components/UnifiedWeather.tsx` | Main weather display |

### Backend

| File | Purpose |
|------|---------|
| `app/main.py` | FastAPI app, CORS, lifespan |
| `app/constants.py` | Lead times, tolerances, thresholds |
| `app/services/accuracy.py` | Forecast verification logic |
| `app/services/open_meteo.py` | External API client |
| `app/models/database.py` | SQLAlchemy models |

## Code Patterns

### Caching Strategy

```
Frontend:
- Model data cache: 5 minutes, 0.01° location tolerance
- Forecast cache (localStorage): 1 hour, 2 decimal precision keys

Backend:
- Observation matching: ±1 hour (0.042 Julian days)
```

### Location Precision

Throughout the codebase, `0.01°` (~1.1km) is used for location matching:
- Cache key generation: `lat.toFixed(2),lon.toFixed(2)`
- Duplicate detection: `Math.abs(a - b) <= 0.01`

This is acceptable because weather data has ~1km resolution anyway.

### Loading States

```typescript
// useWeather.ts pattern
if (hasForecastRef.current) {
  setIsRefreshing(true);  // Background refresh - subtle indicator
} else {
  setLoading(true);       // Initial load - show skeleton
}
```

### Error Handling

```typescript
// Keep old data on error (graceful degradation)
catch (err) {
  setError(err.message);
  if (!hasForecastRef.current) {
    setForecast(null);  // Only clear if we never had data
  }
}
```

## External Dependencies

| Service | Used For | Notes |
|---------|----------|-------|
| api.open-meteo.com | Weather forecasts | Free, no API key |
| archive-api.open-meteo.com | Historical data | Different endpoint! |
| geocoding-api.open-meteo.com | Location search | Free, no API key |
| air-quality-api.open-meteo.com | AQI data | US AQI only currently |
| api.zippopotam.us | ZIP code lookup | Third-party, no fallback |

## Magic Numbers Reference

| Value | Location | Meaning |
|-------|----------|---------|
| `0.01` | Various | ~1.1km location tolerance |
| `0.042` | constants.py | ~1 hour in Julian days |
| `2.0` | constants.py | Temperature tolerance (°C) |
| `5` | HourlyGraph.tsx | Wind speed label threshold (km/h) |
| `0.3` | HourlyGraph.tsx | Bezier curve tension |
| `60` | hourWidth | Pixels per hour in graph |
| `5` | MAX_RECENT_LOCATIONS | Recent locations limit |
| `336` | tauri.conf.json | Tauri window min width (px) |
| `436` | tauri.conf.json | Tauri window max width (px) |

## Known Limitations

1. **US AQI Only**: Air quality uses US standard. EU users see US scale.

2. **SQLite-Specific SQL**: Backend uses `julianday()`. PostgreSQL migration needs query changes.

3. **No Retry Logic**: API failures are logged but not retried. Higher-layer retry is expected.

4. **Single Forecast Cache**: Only one location cached in localStorage at a time.

5. **Zippopotam Dependency**: ZIP code lookup has no fallback if service is down.

## Future Improvements

From code comments and TODOs:

- [ ] Use model accuracy to dynamically adjust ensemble weights
- [ ] Add weather code accuracy (categorical verification)
- [ ] Implement regional accuracy tracking
- [ ] Add accuracy decay over time visualization
- [ ] Add European AQI option
- [ ] Implement LRU cache for multiple locations

## Common Tasks

### Adding a New Weather Model

1. Add model name to `settings.weather_models` in backend config
2. Update `MODEL_WEIGHTS` in `frontend/src/services/ensemble.ts`
3. Test ensemble calculation still works

### Changing Accuracy Tolerances

1. Edit `ACCURACY_TOLERANCES` in `backend/app/constants.py`
2. Consider: this affects historical comparisons

### Adding a New Theme

1. Create `frontend/src/styles/theme-{name}.css`
2. Import in `frontend/src/App.tsx`
3. Add to `Theme` type in `frontend/src/utils/storage.ts`
4. Add button in `frontend/src/components/Settings.tsx`

### Debugging API Issues

1. Check browser Network tab for Open-Meteo responses
2. Backend: Set `echo=True` in database config for SQL logging
3. Frontend: Check `cachedModelData` in api/client.ts

## Icons

Source icons are in `/icons` folder (iOS and Android exports).

| Location | Purpose |
|----------|---------|
| `/icons/iOS/` | iOS app icons (all sizes) |
| `/icons/Android/` | Android app icons (all densities) |
| `/icons/Mac/` | macOS icons (16-512 + @2x variants) |
| `/icons/favicon/` | Favicon source |
| `/frontend/public/` | PWA icons (favicon, apple-touch-icon) |
| `/frontend/src-tauri/icons/` | Tauri native app icons |

### Regenerating Tauri Icons

Use the 1024x1024 iOS artwork as source:
```bash
cd frontend
npm run tauri icon ../icons/iOS/iTunesArtwork@2x.png
```

### Updating PWA Icons

Resize all PWA icons from 1024x1024 source:
```bash
cd frontend/public
sips -z 180 180 ../../icons/iOS/iTunesArtwork@2x.png --out apple-touch-icon.png
sips -z 120 120 ../../icons/iOS/iTunesArtwork@2x.png --out apple-touch-icon-120.png
sips -z 152 152 ../../icons/iOS/iTunesArtwork@2x.png --out apple-touch-icon-152.png
sips -z 167 167 ../../icons/iOS/iTunesArtwork@2x.png --out apple-touch-icon-167.png
sips -z 192 192 ../../icons/iOS/iTunesArtwork@2x.png --out icon-192.png
sips -z 512 512 ../../icons/iOS/iTunesArtwork@2x.png --out icon-512.png
sips -z 16 16 ../../icons/iOS/iTunesArtwork@2x.png --out favicon-16.png
sips -z 32 32 ../../icons/iOS/iTunesArtwork@2x.png --out favicon-32.png
```

### Regenerating macOS .icns

Generate from Mac folder PNGs using iconutil:
```bash
mkdir -p /tmp/Weather.iconset
cp icons/Mac/16.png /tmp/Weather.iconset/icon_16x16.png
cp icons/Mac/16@2x.png /tmp/Weather.iconset/icon_16x16@2x.png
cp icons/Mac/32.png /tmp/Weather.iconset/icon_32x32.png
cp icons/Mac/32@2x.png /tmp/Weather.iconset/icon_32x32@2x.png
cp icons/Mac/128.png /tmp/Weather.iconset/icon_128x128.png
cp icons/Mac/128@2x.png /tmp/Weather.iconset/icon_128x128@2x.png
cp icons/Mac/256.png /tmp/Weather.iconset/icon_256x256.png
cp icons/Mac/256@2x.png /tmp/Weather.iconset/icon_256x256@2x.png
cp icons/Mac/512.png /tmp/Weather.iconset/icon_512x512.png
cp icons/Mac/512@2x.png /tmp/Weather.iconset/icon_512x512@2x.png
iconutil -c icns /tmp/Weather.iconset -o frontend/src-tauri/icons/icon.icns
rm -rf /tmp/Weather.iconset
```

## Git Workflow

- `main` - Production
- `backup/*` - Archived snapshots (before-tauri, with-backend)

## Build Commands

```bash
# Frontend
cd frontend
npm install
npm run dev          # Development server
npm run build        # Production build
npm run deploy       # Deploy to GitHub Pages

# Tauri (requires Rust)
source ~/.cargo/env  # Ensure cargo is in PATH
npm run build:tauri  # Desktop app → src-tauri/target/release/bundle/

# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Testing Checklist

After changes, verify:
- [ ] `npm run build` passes (frontend)
- [ ] Python imports work (backend)
- [ ] No TypeScript errors
- [ ] Weather loads for a location
- [ ] Settings persist after reload
- [ ] Theme switching works
- [ ] Temperature unit toggle works (C/F keys)
