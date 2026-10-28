from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Alert

router = APIRouter(
    prefix="/api/risk",
    tags=["Risk Assessment"],
)


class RiskRequest(BaseModel):
    location: str = Field(min_length=1, max_length=100)
    rainfall: float = 0
    water_level: float = 0
    soil_moisture: float = 0
    temperature: float = 0
    humidity: float = 0


class RiskResponse(BaseModel):
    location: str
    risk_score: float
    risk_level: str
    disaster_type: str
    message: str


@router.post("/assess", response_model=RiskResponse)
def assess_risk(
    data: RiskRequest,
    db: Session = Depends(get_db),
):

    score = 0
    disaster_type = "Normal"

    # Rainfall risk
    if data.rainfall >= 150:
        score += 35
        disaster_type = "Flood"
    elif data.rainfall >= 100:
        score += 25
        disaster_type = "Flood"
    elif data.rainfall >= 50:
        score += 15

    # Water-level risk
    if data.water_level >= 150:
        score += 40
        disaster_type = "Flood"
    elif data.water_level >= 100:
        score += 30
        disaster_type = "Flood"
    elif data.water_level >= 70:
        score += 15

    # Soil moisture risk
    if data.soil_moisture >= 90:
        score += 15
        disaster_type = "Landslide"
    elif data.soil_moisture >= 75:
        score += 10

    # Temperature risk
    if data.temperature >= 40:
        score += 20
        disaster_type = "Extreme Heat"
    elif data.temperature >= 35:
        score += 10

    # Humidity
    if data.humidity >= 90:
        score += 5

    score = min(score, 100)

    # Risk level
    if score >= 75:
        risk_level = "Critical"
    elif score >= 50:
        risk_level = "High"
    elif score >= 25:
        risk_level = "Medium"
    else:
        risk_level = "Low"

    # Message
    if risk_level == "Critical":
        message = "Immediate emergency response recommended."
    elif risk_level == "High":
        message = "High risk detected. Prepare emergency response."
    elif risk_level == "Medium":
        message = "Moderate risk detected. Continue monitoring."
    else:
        message = "Conditions are currently within safe levels."

    # =========================================================
    # SAVE ALERT TO DATABASE
    # =========================================================

    if risk_level in ["Critical", "High", "Medium"]:

        alert = Alert(
            location=data.location,
            disaster_type=disaster_type,
            risk_level=risk_level,
            risk_score=score,
            message=message,
            is_active=1,
        )

        db.add(alert)
        db.commit()
        db.refresh(alert)

    # =========================================================

    return RiskResponse(
        location=data.location,
        risk_score=score,
        risk_level=risk_level,
        disaster_type=disaster_type,
        message=message,
    )