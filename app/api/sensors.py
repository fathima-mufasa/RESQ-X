from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import SensorReading
from app.schemas import SensorReadingCreate, SensorReadingResponse

router = APIRouter(
    prefix="/api/sensors",
    tags=["Sensors"],
)


@router.post(
    "/readings",
    response_model=SensorReadingResponse,
    status_code=201,
)
def create_sensor_reading(
    reading: SensorReadingCreate,
    db: Session = Depends(get_db),
):
    sensor_reading = SensorReading(
        sensor_type=reading.sensor_type,
        location=reading.location,
        value=reading.value,
        unit=reading.unit,
        source=reading.source,
    )

    db.add(sensor_reading)
    db.commit()
    db.refresh(sensor_reading)

    return sensor_reading


@router.get(
    "/latest",
    response_model=list[SensorReadingResponse],
)
def get_latest_readings(
    location: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
):
    query = db.query(SensorReading)

    if location:
        query = query.filter(SensorReading.location == location)

    readings = (
        query
        .order_by(SensorReading.timestamp.desc())
        .limit(5)
        .all()
    )

    return readings


@router.get(
    "/history",
    response_model=list[SensorReadingResponse],
)
def get_sensor_history(
    location: Optional[str] = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(SensorReading)

    if location:
        query = query.filter(SensorReading.location == location)

    return (
        query
        .order_by(SensorReading.timestamp.desc())
        .limit(limit)
        .all()
    )