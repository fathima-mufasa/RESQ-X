from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models
from app.database import Base, engine

from app.api.health import router as health_router
from app.api.sensors import router as sensors_router
from app.api.risk import router as risk_router
from app.api.alerts import router as alerts_router
from app.api.shelters import router as shelters_router
from app.api.dashboard import router as dashboard_router
from app.api.weather import router as weather_router
from app.api.auth import router as auth_router


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="RESQ-X Backend",
    description="Disaster early-warning system API",
    version="1.0.0",
    lifespan=lifespan,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# API ROUTES
# =========================================================

app.include_router(health_router)
app.include_router(sensors_router)
app.include_router(risk_router)
app.include_router(alerts_router)
app.include_router(shelters_router)
app.include_router(dashboard_router)
app.include_router(weather_router)
app.include_router(auth_router)