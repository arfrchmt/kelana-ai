from fastapi import FastAPI, HTTPException

app = FastAPI()

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

from pydantic import BaseModel

class TripRequest(BaseModel):
    destination: str
    days: int
    budget: float
    recommendations: str

from services.trip_service import (
    calculate_daily_budget,
    get_trip_category,
    get_recommendation_transport,
    recomendations,
    recommended_transport
)

@app.get("/recommendations")
def create_trip(request: TripRequest):
    return {
         "recommended_places": recomendations()
    }


from models.trip import Trip
from database import SessionLocal, init_db
init_db()

@app.post("/api/v1/trips")
def create_trip(request: TripRequest):
    # reuse Session 2 business logic
    daily_budget = calculate_daily_budget(request.budget, request.days)
    category     = get_trip_category(request.budget)

    # create a Trip ORM object
    trip = Trip(
        destination  = request.destination,
        days         = request.days,
        budget       = request.budget,
        category     = category,
        daily_budget = daily_budget,
    )

    # save to PostgreSQL
    db = SessionLocal()
    db.add(trip)
    db.commit()
    db.refresh(trip)     # get the auto-generated id
    db.close()
    return trip

@app.get("/api/v1/trips")
def list_trips():
    db = SessionLocal()
    trips = db.query(Trip).all()
    db.close()
    return trips

@app.get("/api/v1/trips/{trip_id}")
def get_trip(trip_id: int):
    db = SessionLocal()
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    db.close()
    # handling not found
    if trip is None:
        raise HTTPException(status_code=404, detail=f"Trip with id {trip_id} not found")
    return trip@app.get("/api/v1/trips/{trip_id}")

@app.delete("/api/v1/trips/{trip_id}")
def delete_trip(trip_id: int):
    db = SessionLocal()
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    db.close()
    # handling not found
    if trip is None:
        raise HTTPException(status_code=404, detail=f"Trip with id {trip_id} not found")

    db.delete(trip)
    db.commit()
    db.close()
    return {"message": f"Trip with id {trip_id} deleted successfully"}

@app.put("/api/v1/trips/{trip_id}")
def update_trip_budget(trip_id: int, new_budget: float):
    db = SessionLocal()
    trip = db.query(Trip).filter(Trip.id == trip_id).first()

    if trip is None:
        db.close()
        raise HTTPException(status_code=404, detail=f"Trip with id {trip_id} not found")

    trip.budget = new_budget
    # optional: update daily_budget juga jika logika bisnis mengharuskan
    if trip.days > 0:
        trip.daily_budget = new_budget / trip.days

    db.commit()
    db.refresh(trip)
    db.close()

    return trip

