const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
).replace(/\/$/, "");
const API_BASE_URL = API_URL.endsWith("/api/v1") ? API_URL : `${API_URL}/api/v1`;

const TOKEN_STORAGE_KEY = "kelana_access_token";
const USER_STORAGE_KEY = "kelana_user";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  created_at?: string | null;
}

export interface AuthResponse {
  access_token: string;
  token_type: "bearer";
  user: AuthUser;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface UpdateProfileData {
  name?: string;
  email?: string;
}

export interface UpdatePasswordData {
  current_password: string;
  new_password: string;
}

async function parseResponse<T>(res: Response, message: string): Promise<T> {
  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`;

    try {
      const data = (await res.json()) as { detail?: string };
      detail = data.detail ?? detail;
    } catch {
      detail = `${res.status} ${res.statusText}`;
    }

    throw new Error(`${message}: ${detail}`);
  }

  return res.json() as Promise<T>;
}

export async function registerUser(data: RegisterData): Promise<AuthUser> {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  return parseResponse<AuthUser>(res, "Failed to register");
}

export async function loginUser(data: LoginData): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const auth = await parseResponse<AuthResponse>(res, "Failed to login");
  saveAuth(auth);
  return auth;
}

function getAuthHeaders(): Record<string, string> {
  const token = getAccessToken();

  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getProfile(): Promise<AuthUser> {
  const res = await fetch(`${API_BASE_URL}/users/me`, {
    headers: getAuthHeaders(),
  });

  const user = await parseResponse<AuthUser>(res, "Failed to load profile");
  saveUser(user);
  return user;
}

export async function updateProfile(data: UpdateProfileData): Promise<AuthUser> {
  const res = await fetch(`${API_BASE_URL}/users/me`, {
    method: "PUT",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const user = await parseResponse<AuthUser>(res, "Failed to update profile");
  saveUser(user);
  return user;
}

export async function updatePassword(data: UpdatePasswordData): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/users/me/password`, {
    method: "PUT",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  await parseResponse<{ message: string }>(res, "Failed to update password");
}

export function saveAuth(auth: AuthResponse) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(TOKEN_STORAGE_KEY, auth.access_token);
  saveUser(auth.user);
}

export function saveUser(user: AuthUser) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

export function getAccessToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function getAuthUser(): AuthUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const value = window.localStorage.getItem(USER_STORAGE_KEY);
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as AuthUser;
  } catch {
    return null;
  }
}

export function clearAuth() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  window.localStorage.removeItem(USER_STORAGE_KEY);
}
