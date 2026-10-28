from datetime import datetime

from pydantic import BaseModel, Field, field_validator


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str


ALLOWED_SENSOR_TYPES = {
    "rainfall": "mm",
    "water_level": "cm",
    "soil_moisture": "%",
    "temperature": "°C",
    "humidity": "%",
}


class SensorReadingCreate(BaseModel):
    sensor_type: str
    location: str = Field(min_length=1, max_length=100)
    value: float
    unit: str
    source: str = "simulated"

    @field_validator("sensor_type")
    @classmethod
    def validate_sensor_type(cls, value: str) -> str:
        value = value.lower().strip()

        if value not in ALLOWED_SENSOR_TYPES:
            raise ValueError(
                "sensor_type must be rainfall, water_level, "
                "soil_moisture, temperature, or humidity"
            )

        return value

    @field_validator("value")
    @classmethod
    def validate_value(cls, value: float) -> float:
        if not value == value:
            raise ValueError("Sensor value cannot be NaN")

        return value


class SensorReadingResponse(BaseModel):
    id: int
    sensor_type: str
    location: str
    value: float
    unit: str
    source: str
    timestamp: datetime

    class Config:
        from_attributes = True