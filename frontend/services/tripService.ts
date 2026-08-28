import { getAccessToken } from "./authService";

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
  is_active?: boolean;
}

export interface GenerateTripData {
  destination: string;
  days: number;
  budget: number;
  travel_style: string;
  recommendations?: string;
}

export interface UpdateTripData {
  destination?: string;
  days?: number;
  budget?: number;
  travel_style?: string;
}

async function parseResponse<T>(res: Response, message: string): Promise<T> {
  if (!res.ok) {
    throw new Error(`${message}: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

function getAuthHeaders(): Record<string, string> {
  const token = getAccessToken();

  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getTrips(): Promise<Trip[]> {
  const res = await fetch(`${API_BASE_URL}/trips`, {
    headers: getAuthHeaders(),
  });
  return parseResponse<Trip[]>(res, "Failed to fetch trips");
}

export async function getTrip(id: number): Promise<Trip> {
  const res = await fetch(`${API_BASE_URL}/trips/${id}`, {
    headers: getAuthHeaders(),
  });
  return parseResponse<Trip>(res, `Failed to fetch trip ${id}`);
}

export async function generateTrip(data: GenerateTripData): Promise<Trip> {
  const res = await fetch(`${API_BASE_URL}/trips`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...data,
      recommendations: data.recommendations ?? "",
    }),
  });

  return parseResponse<Trip>(res, "Failed to generate trip");
}

export async function updateTrip(id: number, data: UpdateTripData): Promise<Trip> {
  const res = await fetch(`${API_BASE_URL}/trips/${id}`, {
    method: "PUT",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return parseResponse<Trip>(res, `Failed to update trip ${id}`);
}

export async function deleteTrip(id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/trips/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  await parseResponse<{ message: string }>(res, `Failed to delete trip ${id}`);
}
