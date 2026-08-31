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
}

export async function askAssistant(question: string): Promise<AssistantAnswer> {
  const response = await fetch(`${API_BASE_URL}/ask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ question }),
  });

  if (!response.ok) {
    throw new Error(`Failed to ask KelanaAI: ${response.status}`);
  }

  return response.json() as Promise<AssistantAnswer>;
}
