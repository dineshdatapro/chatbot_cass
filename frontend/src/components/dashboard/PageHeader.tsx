import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function KPICard({
  label, value, change, icon: Icon, accent,
}: {
  label: string; value: string; change?: number; icon: LucideIcon; accent?: string;
}) {
  const positive = (change ?? 0) >= 0;
  return (
    <div className="rounded-2xl border border-border bg-card p-5 hover:shadow-[var(--shadow-card)] transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center", accent ?? "bg-primary/10 text-primary")}>
          <Icon className="h-4 w-4" />
        </div>
        {change !== undefined && (
          <div className={cn("flex items-center gap-1 text-xs font-medium", positive ? "text-success" : "text-destructive")}>
            {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {positive ? "+" : ""}{change}%
          </div>
        )}
      </div>
      <div className="text-2xl font-display font-bold">{value}</div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

export function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}
