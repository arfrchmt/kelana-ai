recommended_places = [
    "Tokyo Tower",
    "Shibuya",
    "Mount Fuji"
]

for place in recommended_places:
    print(f" - {place}")

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
    if month = 12:
        return "Peak Season"
    elif month = 6:
        return "Holiday Season"
    else:
        return "Regular Season"

daily = calculate_daily_budget(1500,5)
category = get_trip_category(1500)
print(f"{category} - {daily} USD/day")
