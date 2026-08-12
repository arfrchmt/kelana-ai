destination = input("Destination: ")
country = input("Country: ")
days = int(input("Number of days: "))
budget = float(input("Budget: "))
currency  = input("Currency: ")
travel_month = input("Travel Month: ")


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

print_trip_summary(destination, country, days, budget, currency, travel_month)
