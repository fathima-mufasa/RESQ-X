from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import SensorReading


router = APIRouter(
    prefix="/api/sensors",
    tags=["Sensors"],
)


class SensorReadingCreate(BaseModel):
    sensor_type: str
    location: str
    value: float
    unit: str
    source: str = "simulated"


@router.post("/readings")
def create_sensor_reading(
    reading: SensorReadingCreate,
    db: Session = Depends(get_db),
):
    new_reading = SensorReading(
        sensor_type=reading.sensor_type,
        location=reading.location,
        value=reading.value,
        unit=reading.unit,
        source=reading.source,
        timestamp=datetime.now(timezone.utc),
    )

    db.add(new_reading)
    db.commit()
    db.refresh(new_reading)

    return {
        "id": new_reading.id,
        "sensor_type": new_reading.sensor_type,
        "location": new_reading.location,
        "value": new_reading.value,
        "unit": new_reading.unit,
        "source": new_reading.source,
        "timestamp": new_reading.timestamp.isoformat(),
    }