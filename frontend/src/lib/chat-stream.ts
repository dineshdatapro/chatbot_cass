import { API_BASE_URL } from "@/api/client";
import type { ChatMessage } from "@/api/types";
import { getToken } from "@/lib/auth-storage";

export type ChatStreamHandlers = {
  onSession?: (data: { session_id: string; thread_id: string }) => void;
  onMessage?: (data: { messages: ChatMessage[]; sources: string[] }) => void;
  onDone?: (data: { status: string; interrupted: boolean; sources: string[] }) => void;
  onError?: (error: Error) => void;
};

function parseSseBlock(block: string): { event: string; data: string } | null {
  let event = "message";
  let data = "";
  for (const line of block.split("\n")) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    if (line.startsWith("data:")) data += line.slice(5).trim();
  }
  if (!data) return null;
  return { event, data };
}

export async function streamChat(
  payload: { message: string; session_id?: string | null },
  handlers: ChatStreamHandlers,
  signal?: AbortSignal,
): Promise<void> {
  const token = getToken();
  if (!token) {
    handlers.onError?.(new Error("Not authenticated"));
    return;
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      Accept: "text/event-stream",
    },
    body: JSON.stringify({
      message: payload.message,
      session_id: payload.session_id ?? null,
      stream: true,
    }),
    signal,
  });

  if (!response.ok) {
    let detail = response.statusText;
    try {
      const err = await response.json();
      if (typeof err.detail === "string") detail = err.detail;
    } catch {
      /* ignore */
    }
    handlers.onError?.(new Error(detail));
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    handlers.onError?.(new Error("No response stream"));
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() ?? "";
      for (const part of parts) {
        const parsed = parseSseBlock(part.trim());
        if (!parsed) continue;
        try {
          const json = JSON.parse(parsed.data) as Record<string, unknown>;
          if (parsed.event === "session") {
            handlers.onSession?.(json as { session_id: string; thread_id: string });
          } else if (parsed.event === "message") {
            handlers.onMessage?.({
              messages: (json.messages as ChatMessage[]) ?? [],
              sources: (json.sources as string[]) ?? [],
            });
          } else if (parsed.event === "done") {
            handlers.onDone?.({
              status: String(json.status ?? "completed"),
              interrupted: Boolean(json.interrupted),
              sources: (json.sources as string[]) ?? [],
            });
          } else if (parsed.event === "error") {
            const detail = typeof json.detail === "string" ? json.detail : "Chat failed";
            handlers.onError?.(new Error(detail));
            return;
          }
        } catch {
          /* skip malformed chunk */
        }
      }
    }
  } catch (err) {
    if ((err as Error).name !== "AbortError") {
      handlers.onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  }
}
