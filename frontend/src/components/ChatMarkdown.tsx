import { Fragment } from "react";

import { stripSourcesSection } from "@/lib/chat-display";

function formatInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return <Fragment key={index}>{part}</Fragment>;
  });
}

type Block =
  | { type: "heading"; level: number; text: string }
  | { type: "list"; items: string[] }
  | { type: "paragraph"; text: string }
  | { type: "hr" };

function parseBlocks(text: string): Block[] {
  const lines = stripSourcesSection(text).split("\n");
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let listItems: string[] = [];

  const flushParagraph = () => {
    const joined = paragraph.join(" ").trim();
    if (joined) blocks.push({ type: "paragraph", text: joined });
    paragraph = [];
  };

  const flushList = () => {
    if (listItems.length) blocks.push({ type: "list", items: [...listItems] });
    listItems = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      flushParagraph();
      continue;
    }

    if (/^---+$/.test(trimmed)) {
      flushList();
      flushParagraph();
      blocks.push({ type: "hr" });
      continue;
    }

    const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      flushList();
      flushParagraph();
      blocks.push({ type: "heading", level: heading[1].length, text: heading[2].trim() });
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      flushParagraph();
      listItems.push(trimmed.replace(/^[-*]\s+/, ""));
      continue;
    }

    flushList();
    paragraph.push(trimmed);
  }

  flushList();
  flushParagraph();
  return blocks;
}

export function ChatMarkdown({ text }: { text: string }) {
  const blocks = parseBlocks(text);

  if (!blocks.length) {
    return <span>{text}</span>;
  }

  return (
    <div className="space-y-3 text-sm leading-relaxed">
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          if (block.level === 1) {
            return (
              <h3 key={index} className="text-base font-semibold mt-1">
                {formatInline(block.text)}
              </h3>
            );
          }
          if (block.level === 2) {
            return (
              <h4 key={index} className="text-sm font-semibold mt-1">
                {formatInline(block.text)}
              </h4>
            );
          }
          return (
            <h5 key={index} className="text-sm font-medium mt-1">
              {formatInline(block.text)}
            </h5>
          );
        }

        if (block.type === "list") {
          return (
            <ul key={index} className="list-disc pl-5 space-y-1.5">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{formatInline(item)}</li>
              ))}
            </ul>
          );
        }

        if (block.type === "hr") {
          return <hr key={index} className="border-current/10" />;
        }

        return <p key={index}>{formatInline(block.text)}</p>;
      })}
    </div>
  );
}
