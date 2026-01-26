# Weather App

A multi-model ensemble weather forecasting application that combines predictions from 6 different weather models to provide more accurate forecasts with confidence scoring.

## Features

- **Multi-Model Ensemble Forecasting** - Combines GFS, ECMWF, ICON, GEM, JMA, and Meteo-France models
- **Confidence Scoring** - Shows prediction reliability based on model agreement
- **Accuracy Tracking** - Stores forecasts and verifies against actual observations
- **Current Conditions** - Temperature, humidity, wind, precipitation, UV index, air quality
- **7-Day Forecast** - Hourly and daily views with interactive graphs
- **Multiple Themes** - Default, Futuristic (dark), Glass (frosted), OLED (pure black)
- **4 Icon Styles** - Emoji, Weather Icons, Meteocons, Filled SVG
- **Location Search** - City names, ZIP codes (US, UK, Canada)
- **Offline Support** - Service worker caches static assets

## Tech Stack

| Component | Technology |
|-----------|------------|
| Backend | Python 3.10+, FastAPI, SQLAlchemy, SQLite |
| Frontend | React 19, TypeScript, Vite |
| Data Source | [Open-Meteo API](https://open-meteo.com) (free, no API key) |

## Quick Start

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## Project Structure

```
weather-app/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI entry point
│   │   ├── api/routes/       # API endpoints
│   │   ├── services/         # Business logic
│   │   └── models/           # Database & schemas
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── hooks/            # Custom hooks
│   │   ├── api/              # API client
│   │   └── styles/           # Theme CSS
│   └── package.json
│
├── DOCUMENTATION.md          # Full technical documentation
├── LICENSE                   # Usage terms
└── README.md                 # This file
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/forecast` | Ensemble weather forecast |
| `GET /api/forecast/models` | Individual model predictions |
| `GET /api/forecast/geocode` | Location search |
| `GET /api/locations` | Saved locations |
| `GET /api/accuracy` | Forecast accuracy metrics |

Full API documentation available at `http://localhost:8000/docs` when backend is running.

## Documentation

See [DOCUMENTATION.md](DOCUMENTATION.md) for complete technical documentation including:
- Detailed setup instructions
- Full API reference
- Database schema
- Component documentation
- Configuration options
- Debugging tips

## Screenshots

*Screenshots coming soon*

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
