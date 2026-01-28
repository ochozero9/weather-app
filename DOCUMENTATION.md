# Weather App - Complete Documentation

> **Repository**: https://github.com/ochozero9/weather-app
> **Live Demo**: https://ochozero9.github.io/weather-app/
> **Last Updated**: January 2026
> **Stack**: React/TypeScript + Tauri (optional native app)

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Features](#features)
4. [Technology Stack](#technology-stack)
5. [Project Structure](#project-structure)
6. [Setup Instructions](#setup-instructions)
7. [Build & Deploy](#build--deploy)
8. [Core Services](#core-services)
9. [Frontend Components](#frontend-components)
10. [Theming](#theming)
11. [Configuration](#configuration)
12. [Tauri Native App](#tauri-native-app)
13. [Known Limitations](#known-limitations)
14. [Debugging Tips](#debugging-tips)

---

## Overview

A self-contained weather forecasting application that combines predictions from **6 different weather models** into a single ensemble forecast. All computation happens in the browser - no backend server required.

### Key Differentiators

- **Multi-Model Ensemble**: Combines GFS, ECMWF, ICON, GEM, JMA, and Meteo-France models
- **Confidence Scoring**: Shows how much models agree (high agreement = high confidence)
- **Self-Contained**: Runs entirely in the browser, fetches directly from Open-Meteo
- **Multi-Platform**: Web (GitHub Pages) + native macOS app (Tauri)
- **Multiple Themes**: Default, Futuristic (dark), Glass (frosted), OLED (pure black)
- **4 Icon Styles**: Emoji, Weather Icons, Meteocons, Filled SVG

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser / Tauri                       │
├─────────────────────────────────────────────────────────────┤
│  React UI                                                    │
│  ├── Components (CurrentWeather, HourlyGraph, etc.)         │
│  ├── Hooks (useWeather)                                      │
│  └── Utils (storage, conversions)                            │
├─────────────────────────────────────────────────────────────┤
│  API Client Layer                                            │
│  └── client.ts (orchestrates fetching + caching)            │
├─────────────────────────────────────────────────────────────┤
│  Services                                                    │
│  ├── openMeteo.ts  → Direct API calls to Open-Meteo         │
│  └── ensemble.ts   → Weighted averaging, confidence calc     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    External APIs (CORS-enabled)              │
│  ├── api.open-meteo.com/v1/forecast (6 weather models)      │
│  ├── air-quality-api.open-meteo.com (AQI data)              │
│  ├── geocoding-api.open-meteo.com (location search)         │
│  └── api.zippopotam.us (ZIP code lookup)                    │
└─────────────────────────────────────────────────────────────┘
```

**Data Flow:**
1. User searches for location → `openMeteo.geocodeLocation()`
2. App fetches from 6 weather models in parallel → `openMeteo.fetchAllModels()`
3. Raw data combined using weighted averaging → `ensemble.calculateEnsemble()`
4. Confidence scores calculated from model spread
5. UI renders ensemble forecast with confidence indicators

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

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2.0 | UI framework |
| TypeScript | 5.9.3 | Type safety |
| Vite | 7.3.x | Build tool |
| Tauri | 2.x | Native app wrapper |
| react-icons | 5.5.0 | Icon library |

### External APIs

| API | Purpose | Documentation |
|-----|---------|---------------|
| Open-Meteo Forecast | Weather predictions (6 models) | https://open-meteo.com/en/docs |
| Open-Meteo Geocoding | Location search | https://open-meteo.com/en/docs/geocoding-api |
| Open-Meteo Air Quality | AQI data | https://open-meteo.com/en/docs/air-quality-api |
| Zippopotam.us | ZIP code lookup | https://www.zippopotam.us |

---

## Project Structure

```
weather-app/
├── frontend/
│   ├── src/
│   │   ├── main.tsx              # React entry point
│   │   ├── App.tsx               # Main component
│   │   ├── App.css               # Main styles + default theme
│   │   │
│   │   ├── api/
│   │   │   └── client.ts         # API orchestration layer
│   │   │
│   │   ├── services/
│   │   │   ├── openMeteo.ts      # Direct Open-Meteo API calls
│   │   │   └── ensemble.ts       # Weighted averaging + confidence
│   │   │
│   │   ├── components/
│   │   │   ├── CurrentWeather.tsx
│   │   │   ├── UnifiedWeather.tsx
│   │   │   ├── HourlyGraph.tsx
│   │   │   ├── DailyForecast.tsx
│   │   │   ├── LocationSearch.tsx
│   │   │   ├── WeatherIcon.tsx
│   │   │   ├── AccuracyBadge.tsx
│   │   │   ├── ModelComparison.tsx  # Lazy loaded
│   │   │   ├── Settings.tsx         # Lazy loaded
│   │   │   └── *.css
│   │   │
│   │   ├── hooks/
│   │   │   └── useWeather.ts     # Weather data hook
│   │   │
│   │   ├── types/
│   │   │   └── weather.ts        # TypeScript interfaces
│   │   │
│   │   ├── utils/
│   │   │   ├── storage.ts        # localStorage management
│   │   │   ├── weather.ts        # Temperature conversion
│   │   │   └── preload.ts        # Lazy loading helpers
│   │   │
│   │   └── styles/
│   │       ├── theme-futuristic.css
│   │       ├── theme-glass.css
│   │       └── theme-oled.css
│   │
│   ├── public/
│   │   ├── sw.js                 # Service worker
│   │   ├── manifest.json         # PWA manifest
│   │   └── *.png                 # App icons
│   │
│   ├── src-tauri/                # Tauri native app
│   │   ├── src/
│   │   │   ├── main.rs           # Rust entry point
│   │   │   └── lib.rs
│   │   ├── icons/                # Native app icons
│   │   ├── Cargo.toml            # Rust dependencies
│   │   └── tauri.conf.json       # Tauri configuration
│   │
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── backend/                      # Legacy (not required)
├── DOCUMENTATION.md
├── README.md
└── LICENSE
```

---

## Setup Instructions

### Prerequisites

- Node.js 18+
- npm 9+
- (For Tauri) Rust: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`

### Development

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Build & Deploy

### NPM Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run build:web` | Build for web + create 404.html fallback |
| `npm run build:tauri` | Build native macOS app |
| `npm run deploy` | Build and deploy to GitHub Pages |
| `npm run release` | Deploy to GitHub Pages AND build Tauri app |

### Deployment Workflow

```bash
cd frontend

# Update both web and native app
npm run release

# Results:
# - Web: https://ochozero9.github.io/weather-app/ (updated)
# - macOS: src-tauri/target/release/bundle/dmg/Weather_*.dmg
```

### GitHub Pages Configuration

The app is configured to deploy to GitHub Pages at `/weather-app/` subpath:

- Vite `base` config automatically switches between:
  - `/weather-app/` for web builds
  - `./` for Tauri builds
- `manifest.json` and `sw.js` use `/weather-app/` paths
- `404.html` fallback handles SPA routing

---

## Core Services

### openMeteo.ts

Direct API client for Open-Meteo. Fetches from 6 weather models in parallel.

**Weather Models:**
| Model | Source | Weight |
|-------|--------|--------|
| gfs_seamless | NOAA (USA) | 1.0 |
| ecmwf_ifs04 | ECMWF (Europe) | 1.2 |
| icon_seamless | DWD (Germany) | 1.0 |
| gem_seamless | Canada | 0.9 |
| jma_seamless | Japan | 0.9 |
| meteofrance_seamless | France | 1.0 |

**Key Functions:**
```typescript
fetchAllModels(lat, lon)     // Fetch all 6 models in parallel
fetchAirQuality(lat, lon)    // Get AQI data
geocodeLocation(query)       // Search by name or ZIP
```

### ensemble.ts

Combines raw model data into a single ensemble forecast.

**Weighted Average:**
```typescript
// Weights are normalized for missing models
// If only 3 models respond, their weights are rescaled to sum to 1.0
weightedAverage(values, models) → number
```

**Confidence Calculation:**
```typescript
// Exponential decay based on model spread
confidence = 100 × e^(-spread / typical_spread)

// Typical spreads:
// - Temperature: 3.0°C
// - Precipitation: 5.0mm
// - Wind: 5.0 km/h

// At typical spread → ~37% confidence
// At 2x typical → ~13% confidence
```

**Weather Code Selection:**
```typescript
// Weather codes are categorical (can't average)
// Use MODE (most frequent prediction)
// Tie-breaker: higher code wins (more severe weather)
mode(codes) → number
```

---

## Frontend Components

### WeatherIcon

Renders weather icons in 4 different styles.

```tsx
<WeatherIcon
  code={0}           // WMO weather code (0-99)
  style="meteocons"  // 'emoji' | 'wiIcons' | 'meteocons' | 'filled'
  size={48}          // Size in pixels
  time="2026-01-28T19:00"  // For day/night detection
/>
```

### LocationSearch

Autocomplete search with debouncing and request cancellation.

- 300ms debounce on typing
- AbortController cancels in-flight requests
- Keyboard navigation (↑↓ Enter Escape)
- Portal rendering to avoid clipping

### HourlyGraph

SVG chart showing hourly forecast data.

- Fixed 60px width per hour (scrollable)
- Bezier curves for smooth lines
- Precipitation bars at bottom
- Division-by-zero protection

---

## Theming

### CSS Variables

All themes override these root variables:

```css
:root {
  --primary-color: #2563eb;
  --bg-color: #f8fafc;
  --card-bg: #ffffff;
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --border-color: #e2e8f0;

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

## Configuration

### Vite Configuration (vite.config.ts)

```typescript
// Automatically detects Tauri vs web build
const isTauri = process.env.TAURI_ENV_PLATFORM !== undefined

export default defineConfig({
  base: isTauri ? './' : '/weather-app/',
  // ...
})
```

### Storage Keys

All localStorage keys prefixed with `weather-app-`:

| Key | Type | Default |
|-----|------|---------|
| `weather-app-theme` | string | 'default' |
| `weather-app-unit` | 'C' \| 'F' | 'C' |
| `weather-app-icon-style` | string | 'wiIcons' |
| `weather-app-remember-location` | boolean | true |
| `weather-app-last-location` | JSON | null |
| `weather-app-recent-locations` | JSON | [] |

---

## Tauri Native App

### Configuration (tauri.conf.json)

```json
{
  "productName": "Weather",
  "identifier": "com.ochozero9.weather",
  "build": {
    "frontendDist": "../dist",
    "beforeBuildCommand": "npm run build"
  },
  "app": {
    "windows": [{
      "title": "Weather",
      "width": 420,
      "height": 800
    }]
  }
}
```

### Building

```bash
cd frontend
npm run build:tauri

# Output:
# - src-tauri/target/release/bundle/macos/Weather.app (~8MB)
# - src-tauri/target/release/bundle/dmg/Weather_*.dmg (~3MB)
```

### Requirements

- Rust (stable)
- Xcode Command Line Tools (macOS)

---

## Known Limitations

1. **ZIP Code Detection**: Loose pattern matching may have false positives (e.g., German PLZ detected as US ZIP)

2. **Mobile PWA**: Adding to home screen requires clearing old shortcuts when updating paths

3. **Model Availability**: Some models may occasionally be unavailable; the app gracefully handles partial data

4. **Offline Mode**: Service worker caches static assets but weather data always requires network

---

## Debugging Tips

### Frontend

```bash
# Check build for errors
npm run build

# Run linter
npm run lint

# Check bundle size
npm run build && ls -la dist/assets/

# Clear localStorage (browser console)
localStorage.clear()
```

### Tauri

```bash
# Development mode with hot reload
npm run tauri dev

# Build with verbose logging
npm run tauri build -- --verbose

# Check Rust compilation
cd src-tauri && cargo check
```

### Common Issues

| Issue | Solution |
|-------|----------|
| Blank screen | Check browser console for React errors |
| "Unable to connect" | Open-Meteo may be down, check status |
| PWA 404 on launch | Clear old home screen shortcut, re-add |
| Tauri build fails | Ensure Rust is installed: `rustc --version` |

---

## License

This project is released under a **free use, non-commercial license**. See [LICENSE](LICENSE) for full terms.

- Free to use for personal/educational purposes
- Free to modify and share
- No selling or commercial use

---

*Generated with the assistance of Claude Opus 4.5*
