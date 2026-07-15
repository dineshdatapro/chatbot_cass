const SESSION_KEY = "agentic_rag_chat_session_id";

export function getStoredChatSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SESSION_KEY);
}

export function setStoredChatSessionId(sessionId: string): void {
  localStorage.setItem(SESSION_KEY, sessionId);
}

export function clearStoredChatSessionId(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
}
