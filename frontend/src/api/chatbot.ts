import { apiClient } from "@/api/client";
import type {
  ChatResponse,
  ChatSessionDetail,
  ChatSessionListResponse,
} from "@/api/types";

export type ChatPayload = {
  message: string;
  session_id?: string | null;
  stream?: boolean;
};

export async function sendChat(payload: ChatPayload): Promise<ChatResponse> {
  const { data } = await apiClient.post<ChatResponse>("/chat", {
    message: payload.message,
    session_id: payload.session_id ?? null,
    stream: false,
  });
  return data;
}

export async function listChatSessions(): Promise<ChatSessionListResponse> {
  const { data } = await apiClient.get<ChatSessionListResponse>("/chat/sessions");
  return data;
}

export async function getChatSession(sessionId: string): Promise<ChatSessionDetail> {
  const { data } = await apiClient.get<ChatSessionDetail>(`/chat/sessions/${sessionId}`);
  return data;
}

export { streamChat } from "@/lib/chat-stream";
export type { ChatStreamHandlers } from "@/lib/chat-stream";
