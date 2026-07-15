import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Section } from "@/components/dashboard/PageHeader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Globe, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — AgenticRAG AI" }] }),
  component: Settings,
});

const tabs = ["Profile", "Security", "Domains", "Notifications", "API Config"];

function Settings() {
  const [tab, setTab] = useState("Profile");
  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <PageHeader title="Settings" subtitle="Manage your account and workspace preferences." />
      <div className="grid md:grid-cols-[200px_1fr] gap-8">
        <nav className="space-y-1">
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${tab === t ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"}`}>{t}</button>
          ))}
        </nav>
        <div className="space-y-6">
          {tab === "Profile" && (
            <Section title="Profile">
              <div className="flex items-center gap-5 mb-6">
                <div className="h-20 w-20 rounded-full bg-[var(--gradient-primary)] text-white text-2xl font-bold flex items-center justify-center">AL</div>
                <div className="space-x-2"><Button variant="outline" size="sm">Upload new</Button><Button variant="ghost" size="sm">Remove</Button></div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Full name"><Input defaultValue="Ada Lovelace" /></Field>
                <Field label="Email"><Input type="email" defaultValue="ada@acme.io" /></Field>
                <Field label="Company"><Input defaultValue="Acme Inc" /></Field>
                <Field label="Role"><Input defaultValue="Head of Product" /></Field>
              </div>
              <Button variant="gradient" className="mt-6">Save changes</Button>
            </Section>
          )}
          {tab === "Security" && (
            <Section title="Security">
              <div className="space-y-4">
                <Field label="Current password"><Input type="password" /></Field>
                <Field label="New password"><Input type="password" /></Field>
                <Field label="Confirm new password"><Input type="password" /></Field>
                <Button variant="gradient">Update password</Button>
                <div className="pt-6 border-t border-border flex items-center justify-between">
                  <div><div className="font-medium">Two-factor authentication</div><div className="text-sm text-muted-foreground">Add an extra layer of security</div></div>
                  <Switch />
                </div>
              </div>
            </Section>
          )}
          {tab === "Domains" && (
            <Section title="Allowed Domains" action={<Button size="sm" variant="outline"><Plus className="h-4 w-4" /> Add domain</Button>}>
              <div className="divide-y divide-border">
                {["acme.io", "app.acme.io", "docs.acme.io"].map(d => (
                  <div key={d} className="flex items-center gap-3 py-3">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono text-sm flex-1">{d}</span>
                    <Badge variant="secondary">Verified</Badge>
                    <Button size="icon" variant="ghost"><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                  </div>
                ))}
              </div>
            </Section>
          )}
          {tab === "Notifications" && (
            <Section title="Notifications">
              {[
                ["New conversation alerts", "Get notified when a new chat starts"],
                ["Daily summary", "A digest of yesterday's activity each morning"],
                ["Escalation alerts", "When a user requests human handoff"],
                ["Billing alerts", "Before renewals and on plan limits"],
              ].map(([t, d]) => (
                <div key={t} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div><div className="font-medium text-sm">{t}</div><div className="text-xs text-muted-foreground">{d}</div></div>
                  <Switch defaultChecked />
                </div>
              ))}
            </Section>
          )}
          {tab === "API Config" && (
            <Section title="API Configuration">
              <div className="space-y-4">
                <Field label="Webhook endpoint"><Input placeholder="https://yourapp.com/webhooks/agenticrag" /></Field>
                <Field label="Rate limit (requests/min)"><Input type="number" defaultValue={600} /></Field>
                <Field label="Default model"><Input defaultValue="gpt-4o-mini" /></Field>
                <Button variant="gradient">Save config</Button>
              </div>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{label}</Label>{children}</div>;
}
