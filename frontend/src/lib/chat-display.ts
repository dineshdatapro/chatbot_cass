import type { ChatMessage } from "@/api/types";

const FILE_NAME_RE = /File Name:\s*([^\n]+)/gi;
const SOURCES_SECTION_RE = /---\s*\n\*\*Sources:\*\*[\s\S]*$/i;

const INTERNAL_NODES = new Set(["rewrite_query", "summarize_history", "classify_intent"]);

export function isInternalAssistantMessage(message: ChatMessage): boolean {
  if (message.role !== "assistant" || !message.metadata) return false;
  const node = message.metadata.node;
  if (node && INTERNAL_NODES.has(node)) return true;
  const title = message.metadata.title;
  return typeof title === "string" && title.startsWith("🛠️");
}

export function stripSourcesSection(text: string): string {
  return text.replace(SOURCES_SECTION_RE, "").trimEnd();
}

export function extractSourcesFromMessages(messages: ChatMessage[]): string[] {
  const found = new Set<string>();
  for (const msg of messages) {
    const text = msg.content ?? "";
    let match: RegExpExecArray | null;
    FILE_NAME_RE.lastIndex = 0;
    while ((match = FILE_NAME_RE.exec(text)) !== null) {
      const name = match[1].trim();
      if (name && name.toLowerCase() !== "unknown" && name !== "n/a") {
        found.add(name);
      }
    }
  }
  return [...found].sort();
}

export function getAssistantDisplay(messages: ChatMessage[]): {
  text: string;
  isClarification: boolean;
} {
  const clarification = messages.find(
    (m) => m.metadata?.node === "clarification" && m.role === "assistant",
  );
  if (clarification?.content) {
    return { text: clarification.content, isClarification: true };
  }

  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role !== "assistant" || !m.content?.trim()) continue;
    if (isInternalAssistantMessage(m)) continue;
    if (!m.metadata?.title && !m.metadata?.node) {
      return { text: stripSourcesSection(m.content), isClarification: false };
    }
  }

  return { text: "", isClarification: false };
}
