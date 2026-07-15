import { Bot } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function Logo({ className, to = "/" }: { className?: string; to?: string }) {
  return (
    <Link to={to} className={cn("flex items-center gap-2 font-display font-bold text-lg", className)}>
      <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--gradient-primary)] shadow-[var(--shadow-glow)]">
        <Bot className="h-5 w-5 text-white" strokeWidth={2.5} />
      </div>
      <span className="tracking-tight">
        Agentic<span className="gradient-text">RAG</span>
      </span>
    </Link>
  );
}
