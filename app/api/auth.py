from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
import bcrypt

from app.database import get_db
from app.models import User


router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"],
)


# =========================================================
# REQUEST / RESPONSE MODELS
# =========================================================

class RegisterRequest(BaseModel):
    name: str
    nic: str
    email: EmailStr
    password: str
    confirm_password: str
    role: str = "user"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    message: str
    user_id: int
    name: str
    nic: str
    email: str
    role: str


# =========================================================
# REGISTER
# =========================================================

@router.post("/register", response_model=AuthResponse)
def register(
    data: RegisterRequest,
    db: Session = Depends(get_db),
):

    # -----------------------------------------------------
    # Validate name
    # -----------------------------------------------------

    if not data.name.strip():
        raise HTTPException(
            status_code=400,
            detail="Name is required.",
        )

    # -----------------------------------------------------
    # Validate NIC
    # -----------------------------------------------------

    if not data.nic.strip():
        raise HTTPException(
            status_code=400,
            detail="NIC number is required.",
        )

    # -----------------------------------------------------
    # Validate role
    # -----------------------------------------------------

    if data.role not in ["user", "shelter"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid role. Use 'user' or 'shelter'.",
        )

    # -----------------------------------------------------
    # Validate password
    # -----------------------------------------------------

    if len(data.password) < 6:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 6 characters.",
        )

    # -----------------------------------------------------
    # Check password confirmation
    # -----------------------------------------------------

    if data.password != data.confirm_password:
        raise HTTPException(
            status_code=400,
            detail="Passwords do not match.",
        )

    # -----------------------------------------------------
    # Check existing email
    # -----------------------------------------------------

    existing_email = (
        db.query(User)
        .filter(User.email == data.email)
        .first()
    )

    if existing_email:
        raise HTTPException(
            status_code=400,
            detail="Email is already registered.",
        )

    # -----------------------------------------------------
    # Check existing NIC
    # -----------------------------------------------------

    existing_nic = (
        db.query(User)
        .filter(User.nic == data.nic)
        .first()
    )

    if existing_nic:
        raise HTTPException(
            status_code=400,
            detail="NIC number is already registered.",
        )

    # -----------------------------------------------------
    # Hash password
    # -----------------------------------------------------

    password_hash = bcrypt.hashpw(
        data.password.encode("utf-8"),
        bcrypt.gensalt(),
    ).decode("utf-8")

    # -----------------------------------------------------
    # Create new user
    # -----------------------------------------------------

    new_user = User(
        name=data.name.strip(),
        nic=data.nic.strip(),
        email=data.email,
        password_hash=password_hash,
        role=data.role,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # -----------------------------------------------------
    # Return response
    # -----------------------------------------------------

    return AuthResponse(
        message="Registration successful.",
        user_id=new_user.id,
        name=new_user.name,
        nic=new_user.nic,
        email=new_user.email,
        role=new_user.role,
    )


# =========================================================
# LOGIN
# =========================================================

@router.post("/login", response_model=AuthResponse)
def login(
    data: LoginRequest,
    db: Session = Depends(get_db),
):

    # -----------------------------------------------------
    # Find user by email
    # -----------------------------------------------------

    user = (
        db.query(User)
        .filter(User.email == data.email)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password.",
        )

    # -----------------------------------------------------
    # Check password
    # -----------------------------------------------------

    try:
        password_correct = bcrypt.checkpw(
            data.password.encode("utf-8"),
            user.password_hash.encode("utf-8"),
        )
    except Exception:
        password_correct = False

    if not password_correct:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password.",
        )

    # -----------------------------------------------------
    # Check account type
    # -----------------------------------------------------

   
    # -----------------------------------------------------
    # Return login response
    # -----------------------------------------------------

    return AuthResponse(
        message="Login successful.",
        user_id=user.id,
        name=user.name,
        nic=user.nic,
        email=user.email,
        role=user.role,
    )