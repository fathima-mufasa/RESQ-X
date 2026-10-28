from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Alert, SensorReading, Shelter

router = APIRouter(
    prefix="/api/dashboard",
    tags=["Dashboard"],
)


@router.get("/summary")
def dashboard_summary(db: Session = Depends(get_db)):

    latest = (
        db.query(SensorReading)
        .order_by(SensorReading.timestamp.desc())
        .limit(20)
        .all()
    )

    active_alerts = (
        db.query(Alert)
        .filter(Alert.is_active == 1)
        .count()
    )

    active_shelters = (
        db.query(Shelter)
        .filter(Shelter.is_active == 1)
        .count()
    )

    highest_risk = (
        db.query(Alert)
        .filter(Alert.is_active == 1)
        .order_by(Alert.risk_score.desc())
        .first()
    )

    sensor_readings = []

    for reading in latest:
        sensor_readings.append({
            "id": reading.id,
            "sensor_type": reading.sensor_type,
            "location": reading.location,
            "value": reading.value,
            "unit": reading.unit,
            "source": reading.source,
            "timestamp": reading.timestamp.isoformat(),
        })

    return {
        "latest_sensor_readings": sensor_readings,

        "active_alert_count": active_alerts,

        "active_shelter_count": active_shelters,

        "highest_current_risk": (
            highest_risk.risk_level
            if highest_risk
            else "LOW"
        ),

        "highest_risk_score": (
            highest_risk.risk_score
            if highest_risk
            else 0
        ),
    }