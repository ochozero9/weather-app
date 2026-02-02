# Weather App

A self-contained, multi-model ensemble weather forecasting application that combines predictions from 6 different weather models to provide more accurate forecasts with confidence scoring.

**Version:** 1.2.0

## Live Demo & Downloads

| Platform | Link | Status |
|----------|------|--------|
| **Web App (PWA)** | [https://ochozero9.github.io/weather-app/](https://ochozero9.github.io/weather-app/) | Live |
| **macOS App** | [Download from Releases](https://github.com/ochozero9/weather-app/releases) | Apple Silicon |
| **iOS** | Add web app to home screen | PWA |
| **Android** | Add web app to home screen | PWA |

## Export & Deployment Options

| Method | Command | Output |
|--------|---------|--------|
| **Web (GitHub Pages)** | `npm run deploy` | Deploys to GitHub Pages |
| **Web (Static)** | `npm run build:web` | `dist/` folder - host anywhere |
| **macOS App** | `npm run build:tauri` | `src-tauri/target/release/bundle/dmg/Weather_*.dmg` |
| **Full Release** | `npm run release` | GitHub Pages + macOS DMG |

## Features

### Core Forecasting
- **Multi-Model Ensemble** - Combines GFS, ECMWF, ICON, GEM, JMA, and Meteo-France models
- **Confidence Scoring** - Shows prediction reliability based on model agreement (color-coded)
- **Current Conditions** - Temperature, feels like, humidity, wind, precipitation, UV index
- **10-Day Forecast** - Daily high/low temps with precipitation probability
- **Interactive Timeline** - Scrub through 240 hours of forecast with elastic overscroll
- **Hourly Graph** - Visualize temperature, precipitation, snow, and wind

### Reliability & Performance
- **Auto-Refresh** - Configurable intervals: 5, 10, 15, 30, or 60 minutes
- **Offline Support** - Shows cached forecast when offline with visual indicator
- **Retry Logic** - Exponential backoff for failed API requests
- **Loading Skeleton** - Smooth loading state on initial launch
- **Forecast Caching** - Instant display of last forecast while refreshing
- **Optimized Rendering** - React.memo() on key components to prevent unnecessary re-renders
- **DNS Prefetch** - Pre-resolved API connections for faster initial load
- **Request Deduplication** - Prevents duplicate API calls during rapid interactions

### Privacy
- **No Data Collection** - Zero analytics, tracking, or cookies
- **No Account Required** - All data stored locally in browser
- **Open Source** - Full transparency on data handling

### Customization
- **4 Themes** - Classic, Dark, Glass (frosted), OLED (pure black)
- **4 Icon Styles** - Meteocons, Filled, Classic, Emoji
- **Temperature Units** - Celsius/Fahrenheit (keyboard shortcuts: C/F)
- **Location Management** - Save up to 5 recent locations with quick switch

### UX Polish
- **iOS Safe Area** - Proper spacing for home indicator
- **Non-Selectable Text** - Native app-like feel
- **Elastic Dial** - Rubber band effect when scrolling past bounds
- **Model Comparison** - Developer view of individual model predictions

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React 19, TypeScript, Vite 7 |
| Native App | Tauri 2 (Rust + system WebView) |
| Data Source | [Open-Meteo API](https://open-meteo.com) (free, no API key) |
| Geocoding | Open-Meteo + Zippopotam.us |
| Storage | Browser localStorage |
| Hosting | GitHub Pages |

## Quick Start

### Development

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### Build & Deploy

```bash
# Deploy to GitHub Pages
npm run deploy

# Build macOS app only
npm run build:tauri

# Full release (web + macOS)
npm run release
```

## How It Works

1. **Fetches 6 weather models in parallel** from Open-Meteo (free, no API key)
2. **Combines predictions** using weighted averaging (ECMWF weighted highest at 1.2)
3. **Calculates confidence** from model spread using exponential decay
4. **Caches forecast** locally for offline access and instant display
5. **Auto-refreshes** at user-configured intervals

All computation happens client-side in TypeScript.

## Project Structure

```
weather-app/
├── frontend/
│   ├── src/
│   │   ├── api/              # API client with caching & deduplication
│   │   ├── components/       # React components
│   │   ├── constants/        # Weather codes, conversions
│   │   ├── hooks/            # Custom hooks (useWeather)
│   │   ├── services/         # Open-Meteo client + ensemble calculator
│   │   ├── styles/           # Theme CSS files
│   │   ├── types/            # TypeScript interfaces
│   │   └── utils/            # Storage, conversions, weather helpers
│   ├── src-tauri/            # Tauri native app config (optional, for desktop builds)
│   └── package.json
├── backend/                  # Accuracy tracking service (optional)
│   └── app/
│       ├── api/routes/       # FastAPI endpoints
│       ├── services/         # Accuracy calculation
│       └── constants.py      # Configurable thresholds
├── CHANGELOG.md              # Version history
├── DOCUMENTATION.md          # Technical documentation
├── LICENSE
└── README.md
```

## Requirements

### Web Development
- Node.js 18+
- npm 9+

That's it for the web app. The `src-tauri/` folder is included for building the desktop app, but you can ignore it if you only want to run or deploy the web version.

### Native App (Tauri)
If you want to build the macOS desktop app yourself:
- All of the above, plus:
- Rust: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
- Xcode Command Line Tools (macOS): `xcode-select --install`

Or just download the pre-built `.dmg` from [Releases](https://github.com/ochozero9/weather-app/releases).

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for full version history.

### v1.2.0 (2026-01-31)

**Performance**
- DNS prefetch/preconnect for faster API connections
- React.memo() on key components (DailyForecast, CurrentWeather, HourlyGraph)
- Request deduplication prevents duplicate API calls

**Bug Fixes**
- Fixed array bounds checking in forecast processing
- Fixed NaN validation for ZIP code coordinates
- Fixed cache race conditions with in-flight tracking
- Fixed UK postcode regex false positives
- Added silent failure logging for debugging

**Code Quality**
- Removed unused PasswordGate component
- Removed duplicate backend services
- Consolidated WEATHER_CODES to single source
- Refactored storage helpers (340 → 218 lines)
- Comprehensive code documentation added

### v1.1.0 (2026-01-31)

**Features**
- Auto-refresh with configurable intervals (5-60 min)
- Loading skeleton for initial launch
- Forecast caching with stale data indicator
- Offline detection with banner notification
- Retry logic with exponential backoff
- Elastic overscroll on timeline dial

**Improvements**
- Increased dial height with iOS safe area support
- Non-selectable text for app-like feel
- Fixed precipitation icon in 10-day forecast

## Documentation

See [DOCUMENTATION.md](DOCUMENTATION.md) for complete technical documentation.

## Author

Built by **marcox** ([@ochozero9](https://github.com/ochozero9))

## License

**Free use, non-commercial license.** See [LICENSE](LICENSE).

You may:
- Use for personal or educational purposes
- Modify and adapt the code
- Share with others

You may not:
- Sell this software or derivatives
- Use for commercial purposes

---

*Built with [Claude](https://claude.ai) (Opus 4.5)*
