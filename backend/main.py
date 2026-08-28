from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from typing import Optional

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {
        "message": "Welcome to KelanaAI"
    }

@app.get("/health")
def home():
    return {
        "Status": "OK"
    }

from pydantic import BaseModel, field_validator

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def email_must_contain_at(cls, value: str) -> str:
        if "@" not in value or "." not in value.split("@")[-1]:
            raise ValueError("Invalid email address")
        return value.lower().strip()

class LoginRequest(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def email_must_contain_at(cls, value: str) -> str:
        if "@" not in value or "." not in value.split("@")[-1]:
            raise ValueError("Invalid email address")
        return value.lower().strip()

class UserUpdateRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None

    @field_validator("email")
    @classmethod
    def email_must_contain_at(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        if "@" not in value or "." not in value.split("@")[-1]:
            raise ValueError("Invalid email address")
        return value.lower().strip()

class PasswordUpdateRequest(BaseModel):
    current_password: str
    new_password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class AuthResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TripRequest(BaseModel):
    destination: str
    days: int
    budget: float
    travel_style: Optional[str] = None
    recommendations: str

class TripUpdateRequest(BaseModel):
    destination: Optional[str] = None
    days: Optional[int] = None
    budget: Optional[float] = None
    travel_style: Optional[str] = None

from services.trip_service import (
    calculate_daily_budget,
    get_trip_category,
    get_recommendation_transport,
    get_ai_recomendation,
    recomendations,
    recommended_transport
)
from services.auth_service import (
    authenticate_user,
    create_access_token,
    get_user_id_from_token,
    hash_password,
    register_user,
)

from models.trip import Trip
from models.user import User
from database import SessionLocal, init_db
init_db()

@app.post("/api/v1/auth/register", response_model=UserResponse, status_code=201)
def register(request: RegisterRequest):
    db = SessionLocal()

    try:
        return register_user(
            db=db,
            name=request.name,
            email=request.email,
            password=request.password,
        )
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error))
    finally:
        db.close()

@app.post("/api/v1/auth/login", response_model=AuthResponse)
def login(request: LoginRequest):
    db = SessionLocal()

    try:
        user = authenticate_user(db, request.email, request.password)
        if user is None:
            raise HTTPException(status_code=401, detail="Invalid email or password")

        return {
            "access_token": create_access_token(user.id),
            "token_type": "bearer",
            "user": user,
        }
    finally:
        db.close()

def get_current_user(authorization: Optional[str] = Header(default=None)):
    if authorization is None:
        raise HTTPException(status_code=401, detail="Missing bearer token")

    auth_scheme, _, token = authorization.partition(" ")
    if auth_scheme.lower() != "bearer" or not token.strip():
        raise HTTPException(status_code=401, detail="Missing bearer token")

    token = token.strip()
    user_id = get_user_id_from_token(token)
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if user is None:
            raise HTTPException(status_code=401, detail="Invalid or expired token")

        return user
    finally:
        db.close()

@app.get("/api/v1/users/me", response_model=UserResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    return current_user

@app.put("/api/v1/users/me", response_model=UserResponse)
def update_profile(
    request: UserUpdateRequest,
    current_user: User = Depends(get_current_user),
):
    db = SessionLocal()

    try:
        user = db.query(User).filter(User.id == current_user.id).first()
        if user is None:
            raise HTTPException(status_code=401, detail="Invalid or expired token")

        if request.email is not None and request.email != user.email:
            email_owner = db.query(User).filter(User.email == request.email).first()
            if email_owner is not None:
                raise HTTPException(status_code=409, detail="Email already registered")
            user.email = request.email

        if request.name is not None:
            normalized_name = request.name.strip()
            if not normalized_name:
                raise HTTPException(status_code=422, detail="Name cannot be empty")
            user.name = normalized_name

        db.commit()
        db.refresh(user)
        return user
    finally:
        db.close()

@app.put("/api/v1/users/me/password")
def update_password(
    request: PasswordUpdateRequest,
    current_user: User = Depends(get_current_user),
):
    db = SessionLocal()

    try:
        user = db.query(User).filter(User.id == current_user.id).first()
        if user is None:
            raise HTTPException(status_code=401, detail="Invalid or expired token")

        if not authenticate_user(db, user.email, request.current_password):
            raise HTTPException(status_code=401, detail="Current password is incorrect")

        if len(request.new_password) < 8:
            raise HTTPException(
                status_code=422,
                detail="New password must be at least 8 characters",
            )

        user.password_hash = hash_password(request.new_password)
        db.commit()
        return {"message": "Password updated successfully"}
    finally:
        db.close()

@app.get("/recommendations")
def get_recommendations(current_user: User = Depends(get_current_user)):
    return {
         "recommended_places": recomendations()
    }

@app.post("/api/v1/trips")
def create_trip(request: TripRequest, current_user: User = Depends(get_current_user)):
    # reuse Session 2 business logic
    daily_budget = calculate_daily_budget(request.budget, request.days)
    category     = request.travel_style or get_trip_category(request.budget)

    ai_recommendation = get_ai_recomendation(
        destination=request.destination,
        days=request.days,
        budget=request.budget,
        travel_style=category
    )

    # create a Trip ORM object
    trip = Trip(
        destination  = request.destination,
        days         = request.days,
        budget       = request.budget,
        category     = category,
        daily_budget = daily_budget,
        ai_recommendation = ai_recommendation,
        user_id = current_user.id,
        is_active = True,
    )

    # save to PostgreSQL
    db = SessionLocal()
    db.add(trip)
    db.commit()
    db.refresh(trip)     # get the auto-generated id
    db.close()
    return trip

@app.get("/api/v1/trips")
def list_trips(current_user: User = Depends(get_current_user)):
    db = SessionLocal()
    trips = db.query(Trip).filter(
        Trip.user_id == current_user.id,
        Trip.is_active == True,
    ).all()
    db.close()
    return trips

@app.get("/api/v1/trips/{trip_id}")
def get_trip(trip_id: int, current_user: User = Depends(get_current_user)):
    db = SessionLocal()
    trip = db.query(Trip).filter(
        Trip.id == trip_id,
        Trip.user_id == current_user.id,
        Trip.is_active == True,
    ).first()
    db.close()
    # handling not found
    if trip is None:
        raise HTTPException(status_code=404, detail=f"Trip with id {trip_id} not found")
    return trip

@app.delete("/api/v1/trips/{trip_id}")
def delete_trip(trip_id: int, current_user: User = Depends(get_current_user)):
    db = SessionLocal()
    trip = db.query(Trip).filter(Trip.id == trip_id, Trip.is_active == True).first()
    # handling not found
    if trip is None:
        db.close()
        raise HTTPException(status_code=404, detail=f"Trip with id {trip_id} not found")

    if trip.user_id != current_user.id:
        db.close()
        raise HTTPException(status_code=403, detail="Forbidden")

    trip.is_active = False
    db.commit()
    db.refresh(trip)
    db.close()
    return {"message": f"Trip with id {trip_id} deleted successfully"}

@app.put("/api/v1/trips/{trip_id}")
def update_trip(
    trip_id: int,
    request: TripUpdateRequest,
    current_user: User = Depends(get_current_user),
):
    db = SessionLocal()
    trip = db.query(Trip).filter(Trip.id == trip_id, Trip.is_active == True).first()

    if trip is None:
        db.close()
        raise HTTPException(status_code=404, detail=f"Trip with id {trip_id} not found")

    if trip.user_id != current_user.id:
        db.close()
        raise HTTPException(status_code=403, detail="Forbidden")

    if request.destination is not None:
        trip.destination = request.destination
    if request.days is not None:
        trip.days = request.days
    if request.budget is not None:
        trip.budget = request.budget
    if request.travel_style is not None:
        trip.category = request.travel_style or get_trip_category(trip.budget)

    if trip.days > 0:
        trip.daily_budget = trip.budget / trip.days

    db.commit()
    db.refresh(trip)
    db.close()

    return trip

