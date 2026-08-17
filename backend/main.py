from fastapi import FastAPI

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



@app.post("/api/v1/trips")
def create_trip(request: TripRequest):
    daily_budget = calculate_daily_budget(
        request.budget, request.days
    )
    category = get_trip_category(
        request.budget
    )
    transport = get_recommendation_transport(
        request.budget
    )
    return {
        "destination": request.destination,
        "budget": request.budget,
        "daily_budget": daily_budget,
        "category": category,
    }


