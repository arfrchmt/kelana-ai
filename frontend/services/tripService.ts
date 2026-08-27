const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
).replace(/\/$/, "");
const API_BASE_URL = API_URL.endsWith("/api/v1") ? API_URL : `${API_URL}/api/v1`;

export interface Trip {
  id: number;
  destination: string;
  days: number;
  budget: number;
  category: string;
  daily_budget: number;
  ai_recommendation: string | null;
}

export interface GenerateTripData {
  destination: string;
  days: number;
  budget: number;
  travel_style: string;
  recommendations?: string;
}

async function parseResponse<T>(res: Response, message: string): Promise<T> {
  if (!res.ok) {
    throw new Error(`${message}: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

export async function getTrips(): Promise<Trip[]> {
  const res = await fetch(`${API_BASE_URL}/trips`);
  return parseResponse<Trip[]>(res, "Failed to fetch trips");
}

export async function getTrip(id: number): Promise<Trip> {
  const res = await fetch(`${API_BASE_URL}/trips/${id}`);
  return parseResponse<Trip>(res, `Failed to fetch trip ${id}`);
}

export async function generateTrip(data: GenerateTripData): Promise<Trip> {
  const res = await fetch(`${API_BASE_URL}/trips`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...data,
      recommendations: data.recommendations ?? "",
    }),
  });

  return parseResponse<Trip>(res, "Failed to generate trip");
}
