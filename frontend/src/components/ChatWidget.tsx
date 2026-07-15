import { useState, useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { Send, X, MessageCircle, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatMarkdown } from "@/components/ChatMarkdown";
import { useAgenticChat } from "@/hooks/use-agentic-chat";
import { isAuthenticated } from "@/lib/auth-storage";

export interface WidgetConfig {
  name: string;
  welcome: string;
  primaryColor: string;
  secondaryColor: string;
  botAvatar?: string;
  userAvatar?: string;
  position: "bottom-right" | "bottom-left";
  fontFamily: string;
  borderRadius: number;
  dark: boolean;
  suggestions: string[];
  statusText: string;
  logoUrl?: string;
}

export const defaultConfig: WidgetConfig = {
  name: "Aria Assistant",
  welcome: "Hi there! 👋 I'm Aria. Ask me anything about our product.",
  primaryColor: "#7c5cff",
  secondaryColor: "#0ea5e9",
  position: "bottom-right",
  fontFamily: "Inter",
  borderRadius: 20,
  dark: false,
  suggestions: ["What can you do?", "Pricing plans", "How to integrate?"],
  statusText: "Online — replies instantly",
};

export function ChatWidget({
  config = defaultConfig,
  embedded = false,
  defaultOpen = false,
}: {
  config?: WidgetConfig;
  embedded?: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const authed = isAuthenticated();

  const { messages, typing, error, send } = useAgenticChat({ welcome: config.welcome });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const handleSend = (text: string) => {
    if (!authed) return;
    send(text);
    setInput("");
  };

  const panel = (
    <div
      className={cn(
        "flex flex-col w-[360px] h-[560px] shadow-2xl overflow-hidden border",
        embedded ? "max-w-full" : ""
      )}
      style={{
        borderRadius: config.borderRadius,
        fontFamily: `${config.fontFamily}, sans-serif`,
        background: config.dark ? "#0f0f17" : "#ffffff",
        color: config.dark ? "#f5f5f7" : "#111118",
        borderColor: config.dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center gap-3 text-white"
        style={{ background: `linear-gradient(135deg, ${config.primaryColor}, ${config.secondaryColor})` }}
      >
        <div className="h-9 w-9 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
          {config.logoUrl ? (
            <img src={config.logoUrl} alt="" className="h-full w-full object-cover rounded-full" />
          ) : (
            <Sparkles className="h-5 w-5" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate">{config.name}</div>
          <div className="text-[11px] text-white/80 flex items-center gap-1.5">
            <span className={cn("h-1.5 w-1.5 rounded-full bg-green-400", typing && "animate-pulse")} />
            {typing ? "Thinking…" : config.statusText}
          </div>
        </div>
        {!embedded && (
          <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3"
        style={{ background: config.dark ? "#0f0f17" : "#fafafb" }}
      >
        {!authed && (
          <p className="text-xs text-center text-muted-foreground px-2 py-3 rounded-lg border border-dashed border-border">
            <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link> to chat with your Agentic RAG knowledge base.
          </p>
        )}
        {error && (
          <p className="text-xs text-destructive px-2 py-2 rounded-lg border border-destructive/30 bg-destructive/10">
            {error}
          </p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={cn("flex", m.from === "user" ? "justify-end" : "justify-start")}>
            <div
              className="max-w-[80%] text-sm leading-relaxed px-3.5 py-2.5"
              style={{
                borderRadius: 14,
                background:
                  m.from === "user"
                    ? `linear-gradient(135deg, ${config.primaryColor}, ${config.secondaryColor})`
                    : config.dark
                    ? "#1a1a25"
                    : "#ffffff",
                color: m.from === "user" ? "#fff" : config.dark ? "#f5f5f7" : "#111",
                border: m.from === "bot" ? `1px solid ${config.dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}` : "none",
              }}
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
        {typing && messages[messages.length - 1]?.from !== "bot" && (
          <div className="flex justify-start">
            <div
              className="px-3.5 py-2.5 flex gap-1"
              style={{
                borderRadius: 14,
                background: config.dark ? "#1a1a25" : "#ffffff",
                border: `1px solid ${config.dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
              }}
            >
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-current opacity-50 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}

        {authed && messages.length === 1 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {config.suggestions.map((s) => (
              <button
                key={s}
                onClick={() => handleSend(s)}
                disabled={typing}
                className="text-xs px-3 py-1.5 rounded-full border transition hover:scale-[1.02] disabled:opacity-50"
                style={{
                  borderColor: config.primaryColor,
                  color: config.primaryColor,
                  background: config.dark ? "transparent" : `${config.primaryColor}10`,
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <div
        className="p-3 border-t flex items-center gap-2"
        style={{
          borderColor: config.dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
          background: config.dark ? "#0f0f17" : "#ffffff",
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend(input)}
          placeholder={authed ? "Type your message..." : "Sign in to chat"}
          disabled={!authed || typing}
          className="flex-1 bg-transparent text-sm outline-none px-2 py-2 disabled:opacity-50"
          style={{ color: config.dark ? "#f5f5f7" : "#111" }}
        />
        <button
          onClick={() => handleSend(input)}
          disabled={!authed || typing || !input.trim()}
          className="h-9 w-9 rounded-full flex items-center justify-center text-white transition hover:scale-105 disabled:opacity-50"
          style={{ background: `linear-gradient(135deg, ${config.primaryColor}, ${config.secondaryColor})` }}
        >
          {typing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );

  if (embedded) return panel;

  return (
    <div className={cn("fixed z-50 flex flex-col items-end gap-3", config.position === "bottom-right" ? "right-6 bottom-6" : "left-6 bottom-6")}>
      {open && <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">{panel}</div>}
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative h-14 w-14 rounded-full text-white shadow-2xl flex items-center justify-center transition hover:scale-110"
        style={{ background: `linear-gradient(135deg, ${config.primaryColor}, ${config.secondaryColor})` }}
      >
        <span className="absolute inset-0 rounded-full animate-pulse-ring" style={{ background: config.primaryColor }} />
        {open ? <X className="h-6 w-6 relative" /> : <MessageCircle className="h-6 w-6 relative" />}
      </button>
    </div>
  );
}
