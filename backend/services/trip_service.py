recommended_places = [
    "Tokyo Tower",
    "Shibuya",
    "Mount Fuji"
]
recommended_transport = [
    "Bus",
    "Train",
    "Flight"
]

from services.bedrock_service import get_ai_recomendation as get_bedrock_ai_recomendation

for place in recommended_places:
    print(f" - {place}")

def recomendations():
    for place in recommended_places:
        return place

def calculate_daily_budget(budget, days):
    return budget/days

def get_trip_category(budget):
    if budget < 1000:
        return "Backpacker"
    elif budget <= 3000:
        return "Standard"
    else:
        return "Luxury"
    
def get_travel_session(month):
    if month == 12:
        return "Peak Season"
    elif month == 6:
        return "Holiday Season"
    else:
        return "Regular Season"

def get_recommendation_transport(budget):
    category = get_trip_category(budget)
    if category == "Luxury":
        return recommended_transport[2]
    elif category in ["Standard", "Family"]:
        return recommended_transport[1]
    elif category == "Backpacker":
        return recommended_transport[0]
    else:
        return "Unknown"

def get_ai_recomendation(destination, days, budget, travel_style=None):
    return get_bedrock_ai_recomendation(
        destination=destination,
        days=days,
        budget=budget,
        travel_style=travel_style or get_trip_category(budget)
    )
    
daily = calculate_daily_budget(1500,5)
category = get_trip_category(1500)
transport = get_recommendation_transport(1500)
print(f"{category} - {daily} USD/day - {transport}")
