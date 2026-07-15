import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Search, Download, Send, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getChatSession, listChatSessions } from "@/api/chatbot";
import { getApiErrorMessage } from "@/api/client";
import { getStoredUser } from "@/lib/auth-storage";
import { useAgenticChat, type UiChatMessage } from "@/hooks/use-agentic-chat";
import { ChatMarkdown } from "@/components/ChatMarkdown";
import { stripSourcesSection } from "@/lib/chat-display";
import type { StoredChatMessage } from "@/api/types";

export const Route = createFileRoute("/_app/conversations")({
  head: () => ({ meta: [{ title: "Conversations — AgenticRAG AI" }] }),
  component: Convo,
});

function formatTime(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return "";
  }
}

function storedToUi(messages: StoredChatMessage[], welcome: string): UiChatMessage[] {
  if (!messages.length) return [{ id: 1, from: "bot", text: welcome }];
  return messages.map((m, i) => ({
    id: i + 1,
    from: m.role === "user" ? "user" : "bot",
    text: m.role === "assistant" ? stripSourcesSection(m.content) : m.content,
  }));
}

function Convo() {
  const user = getStoredUser();
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const welcome = `Hi ${user?.full_name?.split(" ")[0] ?? "there"}! Ask anything about your knowledge base.`;

  const { data: sessionsData, isLoading: sessionsLoading, isError: sessionsError, error: sessionsErr } = useQuery({
    queryKey: ["chat-sessions"],
    queryFn: listChatSessions,
  });

  const { data: sessionDetail, isLoading: detailLoading } = useQuery({
    queryKey: ["chat-session", activeId],
    queryFn: () => getChatSession(activeId!),
    enabled: Boolean(activeId),
  });

  const {
    messages,
    typing,
    error: chatError,
    send,
    loadHistory,
    resetSession,
    setSessionId,
  } = useAgenticChat({
    welcome,
    sessionId: activeId,
    onSessionChange: (id) => {
      setActiveId(id);
      queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["chat-session", id] });
    },
  });

  const loadedSessionRef = useRef<string | null>(null);

  useEffect(() => {
    if (!activeId) {
      loadedSessionRef.current = null;
      return;
    }
    if (!sessionDetail || sessionDetail.id !== activeId) return;
    if (loadedSessionRef.current === activeId) return;
    loadedSessionRef.current = activeId;
    loadHistory(storedToUi(sessionDetail.messages, welcome));
    setSessionId(sessionDetail.id);
  }, [activeId, sessionDetail, loadHistory, setSessionId, welcome]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const sessions = sessionsData?.items ?? [];
  const filtered = search.trim()
    ? sessions.filter(
        (s) =>
          (s.title ?? "").toLowerCase().includes(search.toLowerCase()) ||
          (s.last_message ?? "").toLowerCase().includes(search.toLowerCase()),
      )
    : sessions;

  const sel = sessions.find((s) => s.id === activeId);

  const handleNewChat = () => {
    loadedSessionRef.current = null;
    resetSession();
    setActiveId(null);
  };

  const handleSend = () => {
    if (!input.trim()) return;
    send(input);
    setInput("");
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="p-6 md:px-8 pb-4">
        <PageHeader
          title="Conversations"
          subtitle="Chat with your Agentic RAG assistant."
          action={
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleNewChat}>
                <Plus className="h-4 w-4" /> New chat
              </Button>
              <Button variant="outline" disabled>
                <Download className="h-4 w-4" /> Export
              </Button>
            </div>
          }
        />
      </div>
      <div className="flex-1 grid md:grid-cols-[400px_1fr] gap-0 border-t border-border min-h-0">
        <div className="border-r border-border flex flex-col bg-card">
          <div className="p-3 space-y-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          {sessionsError && (
            <p className="text-sm text-destructive p-4">{getApiErrorMessage(sessionsErr)}</p>
          )}
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {sessionsLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-4">
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}
            {!sessionsLoading && filtered.length === 0 && (
              <p className="p-6 text-sm text-muted-foreground text-center">
                No conversations yet. Start a new chat.
              </p>
            )}
            {filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={`w-full text-left p-4 hover:bg-muted/30 transition ${activeId === c.id ? "bg-muted/50" : ""}`}
              >
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-full bg-[var(--gradient-primary)] text-white text-xs font-semibold flex items-center justify-center shrink-0">
                    {(c.title ?? "C").charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate">{c.title ?? "Conversation"}</span>
                      <span className="text-xs text-muted-foreground shrink-0">{formatTime(c.updated_at)}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mb-1">Agentic RAG · {c.message_count} messages</div>
                    <div className="text-sm text-muted-foreground truncate">{c.last_message ?? "No messages yet"}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col min-h-0 bg-background">
          <div className="px-6 py-4 border-b border-border flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[var(--gradient-primary)] text-white text-sm font-semibold flex items-center justify-center">
              {(sel?.title ?? user?.full_name ?? "U").charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="font-semibold">{sel?.title ?? "New conversation"}</div>
              <div className="text-xs text-muted-foreground">
                {sel ? `${sel.message_count} messages · Agentic RAG` : "Send a message to begin"}
              </div>
            </div>
            <Badge variant="secondary" className="capitalize">
              {typing ? "active" : sel ? "saved" : "draft"}
            </Badge>
          </div>

          {chatError && (
            <p className="text-sm text-destructive mx-6 mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2">
              {chatError}
            </p>
          )}

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
            {detailLoading && activeId && (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
            {!detailLoading &&
              messages.map((m) => (
                <div key={m.id} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                      m.from === "user" ? "bg-[var(--gradient-primary)] text-white" : "bg-card border border-border"
                    }`}
                  >
                    <div className="text-sm leading-relaxed">
                      {m.from === "bot" && m.text ? (
                        <ChatMarkdown text={m.text} />
                      ) : (
                        <div className="whitespace-pre-wrap">{m.text || (m.streaming ? "…" : "")}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            {typing && (
              <div className="flex justify-start">
                <div className="rounded-2xl px-4 py-3 bg-card border border-border flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-muted-foreground opacity-50 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-border flex items-center gap-2 bg-card">
            <Input
              placeholder="Type your message…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              disabled={typing}
              className="flex-1"
            />
            <Button
              variant="gradient"
              size="icon"
              onClick={handleSend}
              disabled={typing || !input.trim()}
            >
              {typing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
