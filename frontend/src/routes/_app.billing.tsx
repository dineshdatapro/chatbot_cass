import { createFileRoute } from "@tanstack/react-router";
import { Check, Download, CreditCard } from "lucide-react";
import { PageHeader, Section } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_app/billing")({
  head: () => ({ meta: [{ title: "Billing — AgenticRAG AI" }] }),
  component: Billing,
});

const plans = [
  { name: "Starter", price: "$29", features: ["1 chatbot", "500 chats/mo", "5 docs", "Email support"] },
  { name: "Professional", price: "$99", features: ["10 chatbots", "10,000 chats/mo", "Unlimited docs", "Custom branding", "API access"], current: true },
  { name: "Enterprise", price: "Custom", features: ["Unlimited everything", "SSO & SAML", "Dedicated CSM", "SLA"] },
];
const invoices = [
  { id: "INV-0231", date: "May 01, 2026", amount: "$99.00", status: "paid" },
  { id: "INV-0218", date: "Apr 01, 2026", amount: "$99.00", status: "paid" },
  { id: "INV-0205", date: "Mar 01, 2026", amount: "$99.00", status: "paid" },
];

function Billing() {
  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <PageHeader title="Billing & Plans" subtitle="Manage your subscription and invoices." />

      <div className="grid md:grid-cols-3 gap-4">
        <Section title="Current Plan">
          <div className="space-y-1">
            <div className="text-3xl font-display font-bold">Professional</div>
            <div className="text-sm text-muted-foreground">$99 / month · renews June 1, 2026</div>
          </div>
          <Button variant="outline" className="mt-4 w-full">Manage subscription</Button>
        </Section>
        <Section title="Conversations">
          <div className="flex items-baseline gap-2"><span className="text-3xl font-display font-bold">6,842</span><span className="text-sm text-muted-foreground">/ 10,000</span></div>
          <Progress value={68} className="mt-3" />
          <div className="text-xs text-muted-foreground mt-2">Resets in 12 days</div>
        </Section>
        <Section title="Documents">
          <div className="flex items-baseline gap-2"><span className="text-3xl font-display font-bold">312</span><span className="text-sm text-muted-foreground">/ unlimited</span></div>
          <Progress value={20} className="mt-3" />
          <div className="text-xs text-muted-foreground mt-2">Across 8 chatbots</div>
        </Section>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {plans.map((p) => (
          <div key={p.name} className={`rounded-2xl border p-6 ${p.current ? "border-primary bg-card shadow-[var(--shadow-glow)]" : "border-border bg-card"}`}>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold">{p.name}</h3>
              {p.current && <Badge>Current</Badge>}
            </div>
            <div className="mt-3 flex items-baseline gap-1"><span className="text-4xl font-display font-bold">{p.price}</span>{p.price !== "Custom" && <span className="text-sm text-muted-foreground">/mo</span>}</div>
            <Button className="w-full mt-5" variant={p.current ? "outline" : "gradient"} disabled={p.current}>
              {p.current ? "Current plan" : "Upgrade"}
            </Button>
            <ul className="mt-5 space-y-2">
              {p.features.map(f => <li key={f} className="flex gap-2 text-sm"><Check className="h-4 w-4 text-success mt-0.5 shrink-0" /> {f}</li>)}
            </ul>
          </div>
        ))}
      </div>

      <Section title="Payment Method" action={<Button size="sm" variant="outline">Update</Button>}>
        <div className="flex items-center gap-4">
          <div className="h-12 w-16 rounded-lg bg-muted flex items-center justify-center"><CreditCard className="h-5 w-5" /></div>
          <div><div className="font-medium">Visa •••• 4242</div><div className="text-xs text-muted-foreground">Expires 09/28</div></div>
        </div>
      </Section>

      <Section title="Invoices">
        <table className="w-full">
          <thead className="text-xs text-muted-foreground">
            <tr><th className="text-left font-medium py-2">Invoice</th><th className="text-left font-medium py-2">Date</th><th className="text-left font-medium py-2">Amount</th><th className="text-left font-medium py-2">Status</th><th></th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {invoices.map(i => (
              <tr key={i.id}>
                <td className="py-3 font-mono text-sm">{i.id}</td>
                <td className="py-3 text-sm text-muted-foreground">{i.date}</td>
                <td className="py-3 text-sm font-medium">{i.amount}</td>
                <td className="py-3"><Badge variant="secondary" className="capitalize">{i.status}</Badge></td>
                <td className="py-3 text-right"><Button size="sm" variant="ghost"><Download className="h-3.5 w-3.5" /></Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
    </div>
  );
}
