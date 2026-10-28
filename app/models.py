from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Float, Integer, String

from app.database import Base


# =========================================================
# USER AUTHENTICATION
# =========================================================

class User(Base):
    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    name = Column(
        String(150),
        nullable=False,
    )

    nic = Column(
        String(30),
        unique=True,
        index=True,
        nullable=False,
    )

    email = Column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )

    password_hash = Column(
        String(255),
        nullable=False,
    )

    role = Column(
        String(20),
        nullable=False,
        default="user",
    )

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )


# =========================================================
# SENSOR READINGS
# =========================================================

class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    sensor_type = Column(
        String(50),
        nullable=False,
        index=True,
    )

    location = Column(
        String(100),
        nullable=False,
        index=True,
    )

    value = Column(
        Float,
        nullable=False,
    )

    unit = Column(
        String(20),
        nullable=False,
    )

    source = Column(
        String(30),
        nullable=False,
        default="simulated",
    )

    timestamp = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )


# =========================================================
# ALERTS
# =========================================================

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    location = Column(
        String(100),
        nullable=False,
        index=True,
    )

    disaster_type = Column(
        String(50),
        nullable=False,
    )

    risk_level = Column(
        String(20),
        nullable=False,
    )

    risk_score = Column(
        Float,
        nullable=False,
    )

    message = Column(
        String(500),
        nullable=False,
    )

    is_active = Column(
        Integer,
        nullable=False,
        default=1,
    )

    timestamp = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )


# =========================================================
# SHELTERS
# =========================================================

class Shelter(Base):
    __tablename__ = "shelters"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    name = Column(
        String(150),
        nullable=False,
    )

    location = Column(
        String(150),
        nullable=False,
    )

    latitude = Column(
        Float,
        nullable=False,
    )

    longitude = Column(
        Float,
        nullable=False,
    )

    capacity = Column(
        Integer,
        nullable=False,
    )

    available = Column(
        Integer,
        nullable=False,
    )

    contact = Column(
        String(50),
        nullable=True,
    )

    is_active = Column(
        Integer,
        nullable=False,
        default=1,
    )