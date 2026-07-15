import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare, Bot, FileText, Activity, Target, Users, ArrowUpRight, Loader2 } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line,
} from "recharts";
import { PageHeader, KPICard, Section } from "@/components/dashboard/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { getDashboardMetrics } from "@/api/analytics";
import { getApiErrorMessage } from "@/api/client";
import { getStoredUser } from "@/lib/auth-storage";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — AgenticRAG AI" }] }),
  component: Dashboard,
});

const conv = Array.from({ length: 14 }, (_, i) => ({
  day: `D${i + 1}`, conversations: Math.floor(200 + Math.random() * 400), users: Math.floor(80 + Math.random() * 220),
}));
const trends = Array.from({ length: 12 }, (_, i) => ({
  month: ["J","F","M","A","M","J","J","A","S","O","N","D"][i],
  msgs: Math.floor(2000 + Math.random() * 8000),
}));

function formatCount(n: number): string {
  return n.toLocaleString();
}

function Dashboard() {
  const user = getStoredUser();
  const firstName = user?.full_name?.split(" ")[0] ?? "there";

  const { data: metrics, isLoading, isError, error } = useQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: getDashboardMetrics,
  });

  const kpiValue = (value: number | undefined) => formatCount(value ?? 0);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <PageHeader title="Overview" subtitle={`Welcome back, ${firstName}. Here's what's happening today.`} />

      {isError && (
        <p className="text-sm text-destructive mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2">
          {getApiErrorMessage(error)}
        </p>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-5">
              <Skeleton className="h-9 w-9 rounded-lg mb-3" />
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))
        ) : (
          <>
            <KPICard label="Total Conversations" value={kpiValue(0)} change={0} icon={MessageSquare} />
            <KPICard label="Active Chatbots" value={kpiValue(metrics?.activeChatbots)} change={metrics?.ragReady ? 1 : 0} icon={Bot} accent="bg-chart-2/10 text-chart-2" />
            <KPICard label="Documents" value={kpiValue(metrics?.documentCount)} change={metrics?.indexedCount ? 8.1 : 0} icon={FileText} accent="bg-chart-3/10 text-chart-3" />
            <KPICard label="Monthly Usage" value={metrics?.ragReady ? "Ready" : "Offline"} icon={Activity} accent="bg-chart-4/10 text-chart-4" />
            <KPICard label="Response Accuracy" value="—" icon={Target} accent="bg-success/10 text-success" />
            <KPICard label="Unique Visitors" value="—" icon={Users} accent="bg-chart-5/10 text-chart-5" />
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <Section title="Daily Conversations">
            {isLoading ? (
              <div className="flex items-center justify-center h-[280px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={conv}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={11} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }} />
                  <Area type="monotone" dataKey="conversations" stroke="var(--chart-1)" strokeWidth={2} fill="url(#g1)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Section>
        </div>
        <Section title="User Activity">
          {isLoading ? (
            <div className="flex items-center justify-center h-[280px]">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={conv.slice(-7)}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }} />
                <Bar dataKey="users" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Section>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Section title="Chat Usage Trends">
          {isLoading ? (
            <div className="flex items-center justify-center h-[240px]">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }} />
                <Line type="monotone" dataKey="msgs" stroke="var(--chart-1)" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Section>
        <div className="lg:col-span-2">
          <Section title="Recent Conversations" action={<a className="text-sm text-primary flex items-center gap-1 hover:underline" href="/conversations">View all <ArrowUpRight className="h-3 w-3" /></a>}>
            <div className="px-6 py-8 text-center text-sm text-muted-foreground">
              No conversations yet. Start chatting from your widget or chatbot.
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
