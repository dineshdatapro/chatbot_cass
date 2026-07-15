import { createFileRoute, Link, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { isAuthenticated } from "@/lib/auth-storage";
import {
  LayoutDashboard, BookOpen, Bot, Palette, MessageSquare, BarChart3,
  Key, Users, CreditCard, Settings, Code, Bell, Search, ChevronDown,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && !isAuthenticated()) {
      throw redirect({ to: "/login" });
    }
  },
  component: AppLayout,
});

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/knowledge-base", label: "Knowledge Base", icon: BookOpen },
  { to: "/chatbots", label: "Chatbots", icon: Bot },
  { to: "/widget-builder", label: "Widget Builder", icon: Palette },
  { to: "/embed", label: "Embed Code", icon: Code },
  { to: "/conversations", label: "Conversations", icon: MessageSquare },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/api-keys", label: "API Keys", icon: Key },
  { to: "/team", label: "Team Members", icon: Users },
  { to: "/billing", label: "Billing", icon: CreditCard },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function AppLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <aside className="hidden md:flex w-64 flex-col border-r border-sidebar-border bg-sidebar shrink-0">
        <div className="h-16 flex items-center px-5 border-b border-sidebar-border">
          <Logo to="/dashboard" />
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <div className="rounded-xl bg-[var(--gradient-primary)] p-4 text-white">
            <div className="text-xs font-medium opacity-80">Trial ends in 9 days</div>
            <div className="text-sm font-semibold mt-1">Upgrade to Pro</div>
            <Link to="/billing">
              <Button
                size="sm"
                variant="outline"
                className="mt-3 w-full border-white/40 bg-white text-foreground hover:bg-white hover:text-foreground"
              >
                Upgrade
              </Button>
            </Link>
          </div>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border flex items-center gap-3 px-6 bg-background/80 backdrop-blur sticky top-0 z-30">
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search conversations, docs, chatbots..." className="pl-9 bg-muted/50 border-0" />
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button variant="ghost" size="icon"><Bell className="h-4 w-4" /></Button>
            <button className="flex items-center gap-2 ml-2 pl-3 border-l border-border">
              <div className="h-8 w-8 rounded-full bg-[var(--gradient-primary)] flex items-center justify-center text-white text-xs font-semibold">AL</div>
              <div className="hidden lg:block text-left">
                <div className="text-sm font-medium leading-tight">Ada Lovelace</div>
                <div className="text-xs text-muted-foreground leading-tight">Acme Workspace</div>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto"><Outlet /></main>
      </div>
    </div>
  );
}
