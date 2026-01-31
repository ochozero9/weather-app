from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db
from app.api.routes import locations, accuracy
from app.services.open_meteo import open_meteo_client


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    await open_meteo_client.startup()
    yield
    # Shutdown
    await open_meteo_client.shutdown()


app = FastAPI(
    title=settings.app_name,
    description="Multi-model ensemble weather forecasting with accuracy tracking",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS - restrict to known development origins
# Add production domains here when deploying
ALLOWED_ORIGINS = [
    "http://localhost:5173",  # Vite dev server
    "http://localhost:3000",  # Alternative dev port
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Accept"],
)

# Include routers (frontend is serverless, backend only handles DB operations)
app.include_router(locations.router, prefix="/api")
app.include_router(accuracy.router, prefix="/api")


@app.get("/")
async def root():
    return {
        "name": settings.app_name,
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
