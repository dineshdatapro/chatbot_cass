import { createFileRoute } from "@tanstack/react-router";
import { MessageSquare, Users, Clock, Smile, ArrowUpRight } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { PageHeader, KPICard, Section } from "@/components/dashboard/PageHeader";

export const Route = createFileRoute("/_app/analytics")({
  head: () => ({ meta: [{ title: "Analytics — AgenticRAG AI" }] }),
  component: Analytics,
});

const traffic = Array.from({ length: 30 }, (_, i) => ({
  d: `${i + 1}`, messages: Math.floor(800 + Math.random() * 1400), users: Math.floor(200 + Math.random() * 600),
}));
const topQ = [
  { q: "How do I reset my password?", count: 412 },
  { q: "Pricing plans and features", count: 348 },
  { q: "How to integrate with Slack?", count: 287 },
  { q: "Can I cancel anytime?", count: 219 },
  { q: "What file types are supported?", count: 174 },
];
const sources = [
  { name: "product-handbook.pdf", value: 38 },
  { name: "api-reference.md", value: 24 },
  { name: "support-faq.docx", value: 18 },
  { name: "onboarding.pdf", value: 12 },
  { name: "release-notes", value: 8 },
];
const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

function Analytics() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <PageHeader title="Analytics" subtitle="Understand how your AI is performing." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard label="Total Messages" value="124,891" change={18.2} icon={MessageSquare} />
        <KPICard label="Conversations" value="24,891" change={12.5} icon={Users} accent="bg-chart-2/10 text-chart-2" />
        <KPICard label="Avg Response Time" value="1.2s" change={-8.3} icon={Clock} accent="bg-chart-3/10 text-chart-3" />
        <KPICard label="User Satisfaction" value="94.2%" change={2.1} icon={Smile} accent="bg-success/10 text-success" />
      </div>
      <Section title="Message Traffic (Last 30 days)">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={traffic}>
            <defs>
              <linearGradient id="msg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.4} /><stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} /></linearGradient>
              <linearGradient id="usr" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.4} /><stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} /></linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="d" stroke="var(--muted-foreground)" fontSize={11} />
            <YAxis stroke="var(--muted-foreground)" fontSize={11} />
            <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }} />
            <Legend />
            <Area type="monotone" dataKey="messages" stroke="var(--chart-1)" fill="url(#msg)" strokeWidth={2} />
            <Area type="monotone" dataKey="users" stroke="var(--chart-2)" fill="url(#usr)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </Section>
      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <Section title="Top Questions">
          <div className="space-y-3">
            {topQ.map((q) => (
              <div key={q.q} className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="text-sm font-medium mb-1.5">{q.q}</div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--gradient-primary)]" style={{ width: `${(q.count / 412) * 100}%` }} />
                  </div>
                </div>
                <div className="text-sm font-mono text-muted-foreground w-12 text-right">{q.count}</div>
              </div>
            ))}
          </div>
        </Section>
        <Section title="Most Referenced Sources">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={sources} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>
                {sources.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Section>
      </div>
    </div>
  );
}
