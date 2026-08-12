destination = input("Destination: ")
days = int(input("Number of days: "))
budget = float(input("Budget: $"))
travel_style = input("Travel Style: ")


def print_trip_summary(destination, days, budget, travel_style):
    print("------------------------")
    print("KelanaAI")
    print("------------------------")
    print(f"Destination : {destination}")
    print(f"Days        : {days}")
    print(f"Budget      : {budget}")
    print(f"Style       : {travel_style}")

print_trip_summary(destination, days, budget, travel_style)
