# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-01-31

### Added
- **DNS prefetch**: Added preconnect hints for Open-Meteo APIs for faster initial connections
- **Project documentation**: Comprehensive `CLAUDE.md` reference document for development context (local-only, not in repo)
- **Code documentation**: Added detailed comments throughout codebase explaining:
  - Startup logic and state management patterns
  - Caching strategies and cache key precision (~1.1km tolerance)
  - Request deduplication to prevent thundering herd
  - SVG coordinate systems and bezier curve generation
  - Backend accuracy tolerances and database-specific SQL notes

### Changed
- **DailyForecast optimization**: Wrapped with React.memo() and extracted DailyItem as memoized subcomponent
- **Component memoization**: Added React.memo() to CurrentWeather, HourlyGraph, AccuracyBadge
- **Daily forecast keys**: Changed from array index to date string for better React reconciliation

### Fixed
- **Array bounds checking**: Added validation before accessing hourly forecast arrays
- **NaN coordinate validation**: ZIP code parsing now validates latitude/longitude are numbers
- **Silent API failures**: Added logging when historical observation fetch fails
- **UK postcode regex**: Tightened pattern to prevent false positives
- **Sunrise/sunset bounds**: Added array length checks before accessing daily data
- **Cache race conditions**: Added in-flight request tracking to prevent duplicate fetches
- **Empty model data guard**: Added check for empty modelData object before processing

### Removed
- **PasswordGate component**: Removed unused client-side password protection (security anti-pattern)
- **Backend ensemble service**: Removed duplicate of frontend logic (serverless architecture)
- **Backend forecast routes**: Removed unused API routes not called by frontend

### Refactored
- **WEATHER_CODES consolidation**: Single source of truth in `constants/weather.ts`
- **Storage helpers**: Refactored with internal generic functions, reduced from 340 to 218 lines
- **Location handlers**: Merged duplicate handlers into single `handleLocationSelect`
- **Backend constants**: Centralized to `app/constants.py` with documented rationale
- **AccuracyService**: Converted from class-based singleton to plain module functions

### Technical
- Added `CLAUDE.md` with architecture diagrams, code patterns, and common tasks (local-only, not in repo)
- Documented magic numbers: 0.01° tolerance, 0.042 Julian days, bezier tension 0.3
- Added PostgreSQL migration notes for julianday() SQL function
- Documented external API dependencies and fallback strategies

## [1.1.0] - 2026-01-31

### Added
- **Auto-refresh**: Configurable refresh intervals (5, 10, 15, 30, 60 minutes) replacing pull-to-refresh
- **Loading skeleton**: Smooth animated placeholder during initial data load
- **Forecast caching**: Store last forecast in localStorage for instant display
- **Stale data indicator**: Yellow banner when showing cached data with refresh button
- **Offline detection**: Red banner notification when device is offline
- **Retry logic**: Exponential backoff (500ms, 1000ms) for failed API requests
- **Elastic overscroll**: Rubber band effect when scrolling past dial boundaries
- **Privacy section**: New standalone section in Settings confirming no data collection
- **Debug toggle**: Developer option to force-show error states for visual testing
- **WeatherSkeleton component**: New component for loading state UI

### Changed
- **Timeline dial height**: Increased from 85px to 100px with iOS safe area support
- **Forecast card position**: Adjusted to match new dial height
- **Back-to-now button**: Repositioned to align with dial text
- **Text selection**: Disabled globally for app-like feel (inputs remain selectable)
- **Weather icon alignment**: Lowered hero icon to align with temperature number
- **Precipitation icon**: Changed from humidity icon to water droplet in 10-day forecast
- **Day name logic**: Now compares actual dates instead of array index for Today/Tomorrow labels

### Fixed
- **Dial elasticity on desktop**: Global mouseup now properly triggers snap-back animation
- **Glass theme confidence pill**: Fixed class names and increased color opacity for visibility
- **Duplicate day names**: Fixed "Tomorrow" and weekday showing for same date in 10-day forecast
- **Forecast card border**: Added soft top border that works across all themes

### Removed
- **Pull-to-refresh**: Replaced by auto-refresh feature
- **PullToRefresh component**: Deleted as no longer needed

### Technical
- Added `overscrollRef` to TimelineDial for stable closure in event handlers
- Added `isSnapping` state for smooth elastic snap-back animation
- Updated useWeather hook with `isStale`, `isOffline`, `loadFromCache`, and `retry` functions
- Added storage functions: `loadAutoRefreshInterval`, `saveAutoRefreshInterval`, `loadCachedForecast`, `saveForecastCache`
- Added `withRetry` utility function in openMeteo.ts for exponential backoff

## [1.0.0] - 2026-01-28

### Added
- Initial release
- Multi-model ensemble forecasting (GFS, ECMWF, ICON, GEM, JMA, Meteo-France)
- Confidence scoring based on model agreement
- Current conditions display
- 10-day forecast with daily high/low
- Interactive timeline dial for hourly forecast
- Hourly graph with temperature, precipitation, snow, wind layers
- 4 themes: Classic, Dark, Glass, OLED
- 4 icon styles: Meteocons, Filled, Classic, Emoji
- Location search with city names and ZIP codes
- Recent locations management
- Quick location switch
- Temperature unit toggle (C/F) with keyboard shortcuts
- Model comparison view (Developer section)
- PWA support with service worker
- Tauri support for native macOS app
- GitHub Pages deployment

---

## Version History Summary

| Version | Date | Highlights |
|---------|------|------------|
| 1.2.0 | 2026-01-31 | Performance optimizations, bug fixes, code cleanup, documentation |
| 1.1.0 | 2026-01-31 | Auto-refresh, offline support, caching, UI polish |
| 1.0.0 | 2026-01-28 | Initial release |
