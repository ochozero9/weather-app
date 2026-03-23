# Changelog

## [1.2.0] - 2026-01-31

### Improved
- Faster connections to weather data services
- Better performance across the app with optimized rendering

### Fixed
- Fixed potential crashes when weather data was incomplete
- Fixed ZIP code lookup failing for certain formats
- Fixed duplicate weather requests happening at the same time
- Minor bugs fixed

### Removed
- Removed unused password protection feature
- Cleaned up unused backend code

## [1.1.0] - 2026-01-31

### New
- Auto-refresh — weather data updates automatically at your chosen interval
- Offline support — shows your last weather data when you lose connection
- Stale data indicator — lets you know when you're seeing cached weather
- Privacy section in Settings confirming no data is collected

### Improved
- Smoother scrolling with elastic bounce effect on the timeline
- Better "Today" and "Tomorrow" labels in the 10-day forecast

### Fixed
- Fixed the timeline dial not snapping back properly on desktop
- Fixed visibility issues with the confidence indicator in Glass theme
- Fixed duplicate day names appearing in the forecast
- Minor bugs fixed

### Removed
- Replaced pull-to-refresh with the new auto-refresh feature

## [1.0.0] - 2026-01-28

### New
- Initial release — ensemble weather forecasting app
- Combines 6 weather models for more accurate forecasts
- Confidence scoring shows how much models agree
- Current conditions, hourly timeline, and 10-day forecast
- Interactive timeline dial for browsing hourly weather
- Hourly graph with temperature, rain, snow, and wind layers
- 4 themes: Classic, Dark, Glass, OLED
- 4 icon styles to choose from
- Location search by city name or ZIP code
- Recent locations for quick switching
- Temperature units toggle (C/F)
- Works as an installable app (PWA)
- Native macOS app available
