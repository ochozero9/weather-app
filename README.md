# Weather App

A self-contained, multi-model ensemble weather forecasting application that combines predictions from 6 different weather models to provide more accurate forecasts with confidence scoring.

**Live Demo:** https://ochozero9.github.io/weather-app/

## Platforms

| Platform | Description |
|----------|-------------|
| **Web** | Runs in any browser, hosted on GitHub Pages |
| **macOS** | Native app via Tauri (~8MB, uses system WebView) |

## Features

- **Multi-Model Ensemble Forecasting** - Combines GFS, ECMWF, ICON, GEM, JMA, and Meteo-France models
- **Confidence Scoring** - Shows prediction reliability based on model agreement
- **Current Conditions** - Temperature, humidity, wind, precipitation, UV index, air quality
- **7-Day Forecast** - Hourly and daily views with interactive graphs
- **Model Comparison** - Side-by-side view of individual model predictions
- **Multiple Themes** - Default, Futuristic (dark), Glass (frosted), OLED (pure black)
- **4 Icon Styles** - Emoji, Weather Icons, Meteocons, Filled SVG
- **Location Search** - City names, ZIP codes (US, UK, Canada)
- **Offline Support** - Service worker caches static assets
- **No Backend Required** - All API calls and calculations happen in the browser

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React 19, TypeScript, Vite |
| Native App | Tauri 2 (Rust + system WebView) |
| Data Source | [Open-Meteo API](https://open-meteo.com) (free, no API key) |
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

| Command | Description |
|---------|-------------|
| `npm run release` | Deploy to GitHub Pages AND build macOS app |
| `npm run deploy` | Deploy to GitHub Pages only |
| `npm run build:tauri` | Build macOS .dmg only |
| `npm run build:web` | Build for web (no deploy) |

After `npm run release`:
- **Web:** Updated at https://ochozero9.github.io/weather-app/
- **macOS:** DMG at `src-tauri/target/release/bundle/dmg/Weather_*.dmg`

## How It Works

1. **Fetches 6 weather models in parallel** from Open-Meteo (free, no API key)
2. **Combines predictions** using weighted averaging (ECMWF weighted highest at 1.2)
3. **Calculates confidence** from model spread using exponential decay
4. **Displays ensemble forecast** with hourly/daily views and interactive graphs

All computation happens client-side in TypeScript.

## Project Structure

```
weather-app/
├── frontend/
│   ├── src/
│   │   ├── services/         # Open-Meteo client + ensemble calculator
│   │   ├── api/              # API client layer
│   │   ├── components/       # React components
│   │   ├── hooks/            # Custom hooks
│   │   ├── types/            # TypeScript interfaces
│   │   ├── utils/            # Storage, conversions
│   │   └── styles/           # Theme CSS
│   ├── src-tauri/            # Tauri native app config
│   │   ├── src/              # Rust entry point
│   │   ├── icons/            # App icons
│   │   └── tauri.conf.json   # Tauri config
│   └── package.json
│
├── backend/                  # Legacy backend (not required)
├── DOCUMENTATION.md          # Full technical documentation
├── LICENSE
└── README.md
```

## Requirements

### Web Development
- Node.js 18+
- npm 9+

### Native App (Tauri)
- All of the above, plus:
- Rust (install via `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`)
- Xcode Command Line Tools (macOS)

## Documentation

See [DOCUMENTATION.md](DOCUMENTATION.md) for complete technical documentation including:
- Architecture and data flow
- Ensemble algorithm details
- Component documentation
- Configuration options
- Debugging tips

## Author

Built by **marcox** ([@ochozero9](https://github.com/ochozero9))

## License

This project is released under a **free use, non-commercial license**. See [LICENSE](LICENSE) for details.

You are free to:
- Use this software for personal or educational purposes
- Modify and adapt the code
- Share with others

You may not:
- Sell this software or derivatives
- Use for commercial purposes

---

*Built with the assistance of [Claude](https://claude.ai) (Opus 4.5)*
