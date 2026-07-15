import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Bot, MessageSquare, BarChart3, Settings2, MoreVertical } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_app/chatbots")({
  head: () => ({ meta: [{ title: "Chatbots — AgenticRAG AI" }] }),
  component: Bots,
});

const bots = [
  { name: "Support Bot", status: "live", created: "Mar 12", conv: 18420, color: "from-violet-500 to-fuchsia-500" },
  { name: "Sales Assistant", status: "live", created: "Apr 02", conv: 4218, color: "from-sky-500 to-cyan-500" },
  { name: "Onboarding Guide", status: "draft", created: "Apr 18", conv: 0, color: "from-emerald-500 to-teal-500" },
  { name: "Docs Helper", status: "live", created: "Feb 28", conv: 9241, color: "from-amber-500 to-orange-500" },
  { name: "Enterprise FAQ", status: "paused", created: "Jan 15", conv: 1102, color: "from-rose-500 to-pink-500" },
];

function Bots() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Chatbots"
        subtitle="Manage and configure all your AI assistants."
        action={<Button variant="gradient"><Plus className="h-4 w-4" /> Create New Chatbot</Button>}
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {bots.map((b) => (
          <div key={b.name} className="group rounded-2xl border border-border bg-card overflow-hidden hover:shadow-[var(--shadow-elegant)] hover:border-primary/30 transition-all">
            <div className={`h-24 bg-gradient-to-br ${b.color} relative`}>
              <div className="absolute top-3 right-3">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20"><MoreVertical className="h-4 w-4" /></Button>
              </div>
              <div className="absolute -bottom-6 left-5 h-12 w-12 rounded-xl bg-card border-4 border-card flex items-center justify-center">
                <div className={`h-full w-full rounded-lg bg-gradient-to-br ${b.color} flex items-center justify-center`}>
                  <Bot className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>
            <div className="p-5 pt-8">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-semibold">{b.name}</h3>
                <Badge variant={b.status === "live" ? "default" : b.status === "draft" ? "secondary" : "outline"} className="capitalize">{b.status}</Badge>
              </div>
              <div className="text-xs text-muted-foreground mt-1">Created {b.created}</div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-3">
                <MessageSquare className="h-3.5 w-3.5" />
                <span className="font-medium text-foreground">{b.conv.toLocaleString()}</span> conversations
              </div>
              <div className="flex gap-2 mt-4">
                <Link to="/widget-builder" className="flex-1"><Button size="sm" variant="outline" className="w-full"><Settings2 className="h-3.5 w-3.5" /> Edit</Button></Link>
                <Link to="/analytics" className="flex-1"><Button size="sm" variant="outline" className="w-full"><BarChart3 className="h-3.5 w-3.5" /> Analytics</Button></Link>
              </div>
            </div>
          </div>
        ))}
        <Link to="/chatbots" className="rounded-2xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-card transition-colors flex items-center justify-center min-h-[260px] text-muted-foreground hover:text-foreground">
          <div className="text-center">
            <Plus className="h-8 w-8 mx-auto mb-2" />
            <div className="font-medium">Create new chatbot</div>
          </div>
        </Link>
      </div>
    </div>
  );
}
