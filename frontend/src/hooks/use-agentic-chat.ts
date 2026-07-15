import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

import { streamChat } from "@/api/chatbot";
import { getAssistantDisplay, stripSourcesSection } from "@/lib/chat-display";
import {
  clearStoredChatSessionId,
  getStoredChatSessionId,
  setStoredChatSessionId,
} from "@/lib/chat-session-storage";
import { isAuthenticated } from "@/lib/auth-storage";

export type UiChatMessage = {
  id: number;
  from: "bot" | "user";
  text: string;
  sources?: string[];
  streaming?: boolean;
};

type UseAgenticChatOptions = {
  welcome: string;
  sessionId?: string | null;
  onSessionChange?: (sessionId: string) => void;
};

export function useAgenticChat({ welcome, sessionId: externalSessionId, onSessionChange }: UseAgenticChatOptions) {
  const [messages, setMessages] = useState<UiChatMessage[]>([
    { id: 1, from: "bot", text: welcome },
  ]);
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef<string | null>(externalSessionId ?? getStoredChatSessionId());
  const abortRef = useRef<AbortController | null>(null);
  const idRef = useRef(2);

  const nextId = () => {
    idRef.current += 1;
    return idRef.current;
  };

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || typing) return;

      if (!isAuthenticated()) {
        toast.error("Sign in to chat with your knowledge base.");
        return;
      }

      setError(null);
      const userId = nextId();
      const botId = nextId();
      setMessages((m) => [...m, { id: userId, from: "user", text: trimmed }]);
      setTyping(true);
      setMessages((m) => [...m, { id: botId, from: "bot", text: "", streaming: true }]);

      abortRef.current?.abort();
      abortRef.current = new AbortController();

      await streamChat(
        { message: trimmed, session_id: sessionRef.current },
        {
          onSession: ({ session_id }) => {
            sessionRef.current = session_id;
            setStoredChatSessionId(session_id);
            onSessionChange?.(session_id);
          },
          onMessage: ({ messages: ragMsgs }) => {
            const { text: display } = getAssistantDisplay(ragMsgs);
            setMessages((m) =>
              m.map((msg) =>
                msg.id === botId
                  ? { ...msg, text: stripSourcesSection(display) || "Thinking…", streaming: true }
                  : msg,
              ),
            );
          },
          onDone: () => {
            setTyping(false);
            setMessages((m) =>
              m.map((msg) =>
                msg.id === botId
                  ? {
                      ...msg,
                      streaming: false,
                      text: stripSourcesSection(msg.text) || "No response generated.",
                    }
                  : msg,
              ),
            );
          },
          onError: (err) => {
            setTyping(false);
            const message = err.message || "Chat failed";
            setError(message);
            toast.error(message);
            setMessages((m) =>
              m.map((msg) =>
                msg.id === botId
                  ? { ...msg, text: message, streaming: false }
                  : msg,
              ),
            );
          },
        },
        abortRef.current.signal,
      );
    },
    [typing, onSessionChange],
  );

  const loadHistory = useCallback((history: UiChatMessage[]) => {
    idRef.current = history.length + 1;
    setMessages(history.length ? history : [{ id: 1, from: "bot", text: welcome }]);
  }, [welcome]);

  const resetSession = useCallback(() => {
    sessionRef.current = null;
    clearStoredChatSessionId();
    idRef.current = 2;
    setMessages([{ id: 1, from: "bot", text: welcome }]);
    setError(null);
  }, [welcome]);

  const setSessionId = useCallback((id: string | null) => {
    sessionRef.current = id;
    if (id) setStoredChatSessionId(id);
  }, []);

  return {
    messages,
    typing,
    error,
    send,
    loadHistory,
    resetSession,
    setSessionId,
    sessionId: sessionRef.current,
  };
}
