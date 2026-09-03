import { getAccessToken } from "./authService";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
).replace(/\/$/, "");
const API_BASE_URL = API_URL.endsWith("/api/v1") ? API_URL : `${API_URL}/api/v1`;

export interface AssistantSource {
  name: string;
  uri: string;
  score?: number | null;
}

export interface AssistantAnswer {
  question: string;
  answer: string;
  confidence_score?: number | null;
  sources: AssistantSource[];
  created_at?: string | null;
}

export interface ChatMessage {
  id: number;
  conversation_id: number;
  role: "user" | "assistant";
  content: string;
  confidence_score?: number | null;
  sources?: AssistantSource[] | null;
  created_at?: string | null;
}

export interface Conversation {
  id: number;
  user_id: number;
  title?: string | null;
  created_at?: string | null;
}

export interface ConversationDetail extends Conversation {
  messages: ChatMessage[];
}

export interface ConversationAnswerResponse {
  conversation_id: number;
  question: string;
  answer: string;
  confidence_score?: number | null;
  sources: AssistantSource[];
  messages: ChatMessage[];
}

function getAuthHeaders(): Record<string, string> {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseResponse<T>(res: Response, message: string): Promise<T> {
  if (!res.ok) {
    let errorDetail = "";
    try {
      const data = await res.json();
      errorDetail = data.detail || "";
    } catch {
      // ignore json parse error
    }
    throw new Error(
      errorDetail
        ? `${message}: ${errorDetail}`
        : `${message} (${res.status} ${res.statusText})`
    );
  }

  return res.json() as Promise<T>;
}

export async function askAssistant(
  question: string,
  conversationId?: number | null,
  conversationHistory?: { role: string; content: string }[]
): Promise<AssistantAnswer> {
  const payload: Record<string, unknown> = { question };
  if (conversationId) {
    payload.conversation_id = conversationId;
  }
  if (conversationHistory && conversationHistory.length > 0) {
    payload.conversation_history = conversationHistory;
  }

  const response = await fetch(`${API_BASE_URL}/ask`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseResponse<AssistantAnswer>(response, "Gagal meminta jawaban KelanaAI");
}

export async function getConversations(): Promise<Conversation[]> {
  const response = await fetch(`${API_BASE_URL}/conversations`, {
    headers: getAuthHeaders(),
  });

  return parseResponse<Conversation[]>(response, "Gagal memuat percakapan");
}

export async function getConversation(id: number): Promise<ConversationDetail> {
  const response = await fetch(`${API_BASE_URL}/conversations/${id}`, {
    headers: getAuthHeaders(),
  });

  return parseResponse<ConversationDetail>(response, `Gagal memuat percakapan #${id}`);
}

export async function createConversation(title?: string): Promise<Conversation> {
  const response = await fetch(`${API_BASE_URL}/conversations`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(title ? { title } : {}),
  });

  return parseResponse<Conversation>(response, "Gagal membuat sesi percakapan baru");
}

export async function sendConversationMessage(
  conversationId: number,
  question: string
): Promise<ConversationAnswerResponse> {
  const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ question }),
  });

  return parseResponse<ConversationAnswerResponse>(
    response,
    "Gagal mengirim pesan percakapan"
  );
}

export async function deleteConversation(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/conversations/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  await parseResponse<{ message: string }>(
    response,
    `Gagal menghapus percakapan #${id}`
  );
}
