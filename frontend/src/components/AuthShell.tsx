import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";

export function AuthShell({ title, subtitle, children, footer }: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex relative items-center justify-center p-12 border-r border-border overflow-hidden">
        <div className="absolute inset-0 mesh-bg opacity-90" />
        <div className="absolute inset-0 grid-bg opacity-20" />
        <div className="relative max-w-md space-y-6">
          <Logo />
          <h2 className="font-display text-4xl font-bold leading-tight">
            Ship AI chatbots your customers actually <span className="gradient-text">love</span>.
          </h2>
          <p className="text-muted-foreground">
            Join 10,000+ teams using AgenticRAG to deploy production-grade AI assistants in minutes.
          </p>
          <div className="flex items-center gap-3 pt-4">
            <div className="flex -space-x-2">
              {[1,2,3,4].map(i => <div key={i} className="h-8 w-8 rounded-full bg-[var(--gradient-primary)] border-2 border-background" />)}
            </div>
            <span className="text-sm text-muted-foreground">+10k teams onboard this month</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <div className="flex justify-between p-6 lg:hidden">
          <Logo />
          <ThemeToggle />
        </div>
        <div className="hidden lg:flex justify-end p-6"><ThemeToggle /></div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-sm space-y-8">
            <div className="space-y-2">
              <h1 className="font-display text-3xl font-bold">{title}</h1>
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            </div>
            {children}
            <div className="text-sm text-center text-muted-foreground">{footer}</div>
            <div className="text-center text-xs text-muted-foreground">
              <Link to="/" className="hover:text-foreground">← Back to home</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
