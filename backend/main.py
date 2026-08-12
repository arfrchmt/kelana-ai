destination = input("Destination: ")
country = input("Country: ")
days = int(input("Number of days: "))
budget = float(input("Budget: "))
currency  = input("Currency: ")
travel_month = input("Travel Month: ")

if budget < 1000:
    category = "Backpacker"
elif budget < 3000:
    category = "Standard"
else:
    category = "Luxury"

daily_budget = budget/days

recommended_places = [
    "Tokyo Tower",
    "Shibuya",
    "Mount Fuji"
]

# Loop through the list
for place in recommended_places:
    print(f" - {place}")

def calculate_daily_budget(budget, days):
    return budget/days

def get_trip_category(budget):
    if budget < 1000:
        return "Backpacker"
    elif budget < 3000:
        return "Standard"
    else:
        return "Luxury"

daily = calculate_daily_budget(1500,5)
category = get_trip_category(1500)
print(f"{category} · {daily} USD/day")

def print_trip_summary(destination, country, days, budget, currency, travel_month):
    print("------------------------")
    print("KelanaAI")
    print("------------------------")
    print(f"Destination : {destination}")
    print(f"Country : {country}")
    print(f"Days        : {days}")
    print(f"Budget      : {budget}")
    print(f"Currency      : {currency}")
    print(f"Travel_month       : {travel_month}")
    print(f"Category : {category}")
    print(f"Daily Budget : {daily_budget} USD/day")

print_trip_summary(destination, country, days, budget, currency, travel_month)
