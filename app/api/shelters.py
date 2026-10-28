from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Shelter

router = APIRouter(prefix="/api/shelters", tags=["Shelters"])


class ShelterCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    location: str = Field(min_length=1, max_length=150)
    latitude: float
    longitude: float
    capacity: int = Field(ge=1)
    available: int = Field(ge=0)
    contact: str | None = None


@router.post("")
def create_shelter(
    data: ShelterCreate,
    db: Session = Depends(get_db),
):
    shelter = Shelter(**data.model_dump())

    db.add(shelter)
    db.commit()
    db.refresh(shelter)

    return shelter


@router.get("")
def get_shelters(db: Session = Depends(get_db)):
    return (
        db.query(Shelter)
        .filter(Shelter.is_active == 1)
        .all()
    )


@router.get("/{shelter_id}")
def get_shelter(
    shelter_id: int,
    db: Session = Depends(get_db),
):
    shelter = (
        db.query(Shelter)
        .filter(Shelter.id == shelter_id)
        .first()
    )

    if not shelter:
        raise HTTPException(
            status_code=404,
            detail="Shelter not found",
        )

    return shelter