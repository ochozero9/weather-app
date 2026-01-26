from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db
from app.api.routes import forecast, locations, accuracy


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    yield
    # Shutdown


app = FastAPI(
    title=settings.app_name,
    description="Multi-model ensemble weather forecasting with accuracy tracking",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS - allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(forecast.router, prefix="/api")
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
