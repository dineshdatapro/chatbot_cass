import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight, Bot, Check, Code2, FileText, Globe, MessageSquare,
  Play, Shield, Sparkles, Star, Upload, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ChatWidget } from "@/components/ChatWidget";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AgenticRAG AI — Deploy AI Chatbots in Minutes" },
      { name: "description", content: "Upload documents, customize your assistant, and embed a powerful Agentic RAG chatbot anywhere with one script." },
      { property: "og:title", content: "AgenticRAG AI" },
      { property: "og:description", content: "Deploy AI Chatbots on your website in minutes." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <Hero />
      <LogoCloud />
      <Features />
      <HowItWorks />
      <WidgetShowcase />
      <Testimonials />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
      <ChatWidget />
    </div>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/50 glass">
      <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
        <Logo />
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition">Features</a>
          <a href="#how" className="hover:text-foreground transition">How it works</a>
          <a href="#pricing" className="hover:text-foreground transition">Pricing</a>
          <a href="#faq" className="hover:text-foreground transition">FAQ</a>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link to="/login"><Button variant="ghost" size="sm">Sign in</Button></Link>
          <Link to="/register"><Button size="sm" variant="gradient" className="shadow-[var(--shadow-glow)]">Start free</Button></Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 mesh-bg opacity-70 pointer-events-none" />
      <div className="absolute inset-0 grid-bg opacity-30 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      <div className="relative mx-auto max-w-7xl px-6 pt-24 pb-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 backdrop-blur px-3 py-1 text-xs">
              <Sparkles className="h-3 w-3 text-primary" />
              <span className="text-muted-foreground">Powered by Agentic RAG · Now in public beta</span>
            </div>
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]">
              Deploy an AI Chatbot on Your Website in{" "}
              <span className="gradient-text">Minutes</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
              Upload documents, customize your assistant, and embed a powerful Agentic RAG chatbot anywhere with a single script.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/register">
                <Button size="lg" variant="gradient" className="shadow-[var(--shadow-glow)] h-12 px-6 text-base">
                  Start Free Trial <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="h-12 px-6 text-base">
                <Play className="h-4 w-4" /> Watch Demo
              </Button>
            </div>
            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground pt-2">
              {["No credit card", "14-day trial", "Cancel anytime"].map((t) => (
                <div key={t} className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> {t}</div>
              ))}
            </div>
          </div>
          <div className="relative h-[600px] hidden lg:block">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="absolute h-96 w-96 rounded-full bg-primary/30 blur-3xl animate-float" />
            </div>
            <div className="relative h-full flex items-center justify-center animate-float">
              <ChatWidget embedded defaultOpen />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function LogoCloud() {
  const logos = ["Acme Corp", "Nimbus", "Forge", "Quanta", "Lumen", "Vexa"];
  return (
    <section className="border-y border-border/50 py-12">
      <div className="mx-auto max-w-7xl px-6">
        <p className="text-center text-xs uppercase tracking-widest text-muted-foreground mb-8">Trusted by teams shipping fast</p>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-60">
          {logos.map((l) => (
            <div key={l} className="font-display font-bold text-xl tracking-tight">{l}</div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  const features = [
    { icon: Upload, title: "Train on your data", desc: "Upload PDFs, Markdown, DOCX, TXT. We chunk, embed, and index automatically." },
    { icon: Sparkles, title: "Agentic RAG engine", desc: "Multi-step reasoning, source attribution, and tool use baked in." },
    { icon: Code2, title: "One-line install", desc: "Drop a single script tag. Works on HTML, React, WordPress, Shopify." },
    { icon: MessageSquare, title: "Fully customizable widget", desc: "Colors, avatars, tone, position. Match your brand pixel-perfect." },
    { icon: Shield, title: "Enterprise security", desc: "SOC 2, GDPR, data residency. Your data never trains foundation models." },
    { icon: Zap, title: "Lightning fast", desc: "Sub-second response times with edge inference and smart caching." },
  ];
  return (
    <section id="features" className="py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-16 space-y-4">
          <div className="text-sm font-medium text-primary">Features</div>
          <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight">Everything you need to ship</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">From knowledge ingestion to deployment, we handle the hard parts so you can focus on your product.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="group rounded-2xl border border-border bg-card p-6 hover:shadow-[var(--shadow-elegant)] hover:border-primary/30 transition-all">
              <div className="h-11 w-11 rounded-xl bg-[var(--gradient-primary)] flex items-center justify-center mb-4 shadow-[var(--shadow-glow)]">
                <f.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-display text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: "01", title: "Upload your docs", desc: "Drag and drop PDFs, paste URLs, connect Notion." },
    { n: "02", title: "Customize your bot", desc: "Tweak persona, colors, suggested questions in our live builder." },
    { n: "03", title: "Embed anywhere", desc: "Copy one snippet, paste into your site. Done." },
  ];
  return (
    <section id="how" className="py-32 border-t border-border/50">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-16 space-y-4">
          <div className="text-sm font-medium text-primary">How it works</div>
          <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight">From zero to deployed in 3 steps</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8 relative">
          {steps.map((s, i) => (
            <div key={s.n} className="relative">
              <div className="rounded-2xl border border-border bg-card p-8 h-full">
                <div className="text-6xl font-display font-bold gradient-text mb-4">{s.n}</div>
                <h3 className="font-display text-xl font-semibold mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
              {i < 2 && <ArrowRight className="hidden md:block absolute top-1/2 -right-6 text-muted-foreground/30" />}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WidgetShowcase() {
  return (
    <section className="py-32 border-t border-border/50 relative overflow-hidden">
      <div className="absolute inset-0 mesh-bg opacity-50 pointer-events-none" />
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <div className="text-sm font-medium text-primary">Widget showcase</div>
            <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight">Looks native on any site</h2>
            <p className="text-muted-foreground text-lg">Real-time preview, dark mode, mobile-responsive, accessible. Your customers won't know it's a third-party widget.</p>
            <ul className="space-y-3">
              {["Live preview as you edit", "Source citations in every reply", "Mobile-first responsive design", "Built-in handoff to humans"].map((t) => (
                <li key={t} className="flex items-center gap-3 text-sm">
                  <div className="h-5 w-5 rounded-full bg-success/20 flex items-center justify-center">
                    <Check className="h-3 w-3 text-success" />
                  </div>{t}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative flex justify-center">
            <div className="absolute inset-0 bg-[var(--gradient-primary)] opacity-30 blur-3xl rounded-full" />
            <div className="relative"><ChatWidget embedded defaultOpen /></div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const items = [
    { quote: "Replaced our $40k/yr support tool in a weekend. The Agentic RAG quality is wild.", name: "Sara Chen", role: "Head of Support, Nimbus" },
    { quote: "We went from zero to a fully-trained bot in under an hour. Customers love it.", name: "Marcus Webb", role: "Founder, Forge.io" },
    { quote: "The widget builder is the cleanest I've used. Pixel-perfect on first try.", name: "Priya Shah", role: "Design Lead, Quanta" },
  ];
  return (
    <section className="py-32 border-t border-border/50">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-16 space-y-4">
          <div className="text-sm font-medium text-primary">Loved by teams</div>
          <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight">What our customers say</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {items.map((t) => (
            <div key={t.name} className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <div className="flex gap-0.5">{[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-warning text-warning" />)}</div>
              <p className="text-sm leading-relaxed">"{t.quote}"</p>
              <div className="flex items-center gap-3 pt-2 border-t border-border">
                <div className="h-9 w-9 rounded-full bg-[var(--gradient-primary)]" />
                <div>
                  <div className="text-sm font-medium">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const plans = [
    { name: "Starter", price: "$29", desc: "For side projects and small sites.", features: ["1 chatbot", "500 conversations/mo", "5 documents", "Email support"], cta: "Start free trial", popular: false },
    { name: "Professional", price: "$99", desc: "For growing teams.", features: ["10 chatbots", "10,000 conversations/mo", "Unlimited documents", "Custom branding", "API access", "Priority support"], cta: "Start free trial", popular: true },
    { name: "Enterprise", price: "Custom", desc: "For larger organizations.", features: ["Unlimited chatbots", "Unlimited conversations", "SSO & SAML", "Dedicated CSM", "SLA & data residency", "White-label"], cta: "Contact sales", popular: false },
  ];
  return (
    <section id="pricing" className="py-32 border-t border-border/50">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-16 space-y-4">
          <div className="text-sm font-medium text-primary">Pricing</div>
          <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight">Simple, transparent pricing</h2>
          <p className="text-muted-foreground">Start free. Upgrade when you're ready.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative rounded-2xl border p-8 ${p.popular ? "border-primary bg-card shadow-[var(--shadow-glow)]" : "border-border bg-card"}`}
            >
              {p.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold px-3 py-1 rounded-full bg-[var(--gradient-primary)] text-white">
                  Most popular
                </div>
              )}
              <h3 className="font-display text-xl font-semibold">{p.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{p.desc}</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-5xl font-display font-bold">{p.price}</span>
                {p.price !== "Custom" && <span className="text-muted-foreground">/mo</span>}
              </div>
              <Link to="/register" className="block mt-6">
                <Button className="w-full" variant={p.popular ? "gradient" : "outline"}>
                  {p.cta}
                </Button>
              </Link>
              <ul className="mt-8 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-success mt-0.5 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const faqs = [
    { q: "How is this different from ChatGPT?", a: "Your chatbot is trained on YOUR documents, not the open internet. It cites sources, never hallucinates pricing, and works inside your brand." },
    { q: "What file types are supported?", a: "PDF, DOCX, Markdown, TXT, and HTML. URLs and Notion coming soon." },
    { q: "Can I cancel anytime?", a: "Yes. Cancel from billing settings, no questions asked. We pro-rate refunds for annual plans." },
    { q: "Where is my data stored?", a: "AWS us-east-1 by default. EU residency available on Pro and Enterprise." },
    { q: "Do you train on my data?", a: "Never. Your data is yours. We use it solely to answer your users' queries." },
  ];
  return (
    <section id="faq" className="py-32 border-t border-border/50">
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center mb-12 space-y-4">
          <div className="text-sm font-medium text-primary">FAQ</div>
          <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight">Questions, answered</h2>
        </div>
        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={String(i)} className="border border-border rounded-xl px-5 bg-card">
              <AccordionTrigger className="text-left font-medium">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="py-32 border-t border-border/50">
      <div className="mx-auto max-w-5xl px-6">
        <div className="relative overflow-hidden rounded-3xl border border-border p-16 text-center bg-card">
          <div className="absolute inset-0 mesh-bg opacity-80" />
          <div className="relative space-y-6">
            <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight">Ready to deploy your AI?</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Join thousands of teams shipping smarter support, faster.</p>
            <Link to="/register">
              <Button size="lg" variant="gradient" className="shadow-[var(--shadow-glow)] h-12 px-8 text-base">
                Start your free trial <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/50 py-12">
      <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row gap-6 items-center justify-between">
        <div className="flex items-center gap-6">
          <Logo />
          <span className="text-xs text-muted-foreground hidden md:inline">© 2026 AgenticRAG AI</span>
        </div>
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <a href="#" className="hover:text-foreground">Privacy</a>
          <a href="#" className="hover:text-foreground">Terms</a>
          <a href="#" className="hover:text-foreground">Security</a>
          <a href="#" className="hover:text-foreground">Status</a>
        </div>
      </div>
    </footer>
  );
}
