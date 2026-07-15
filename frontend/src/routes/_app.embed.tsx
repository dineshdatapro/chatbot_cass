import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { buildEmbedSnippets } from "@/lib/embed-snippets";
import { getEmbedApiEnvName } from "@/lib/public-api-url";

export const Route = createFileRoute("/_app/embed")({
  head: () => ({ meta: [{ title: "Embed — AgenticRAG AI" }] }),
  component: Embed,
});

function Embed() {
  const snippets = useMemo(() => buildEmbedSnippets(), []);
  const [copied, setCopied] = useState<string | null>(null);
  const copy = (key: string, txt: string) => {
    navigator.clipboard.writeText(txt);
    setCopied(key);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <PageHeader
        title="Embed Code"
        subtitle={`Paste this on any website. API URL is read from ${getEmbedApiEnvName()} in frontend/.env (currently: ${snippets.apiBase}).`}
      />

      <div className="mb-6 rounded-xl border border-border bg-muted/40 p-4 text-sm space-y-2">
        <p className="font-medium">Environment configuration</p>
        <ul className="list-disc list-inside text-muted-foreground space-y-1">
          <li>
            Frontend dashboard: set <code className="text-xs">VITE_EMBED_API_URL</code> or{" "}
            <code className="text-xs">VITE_API_URL</code> in <code className="text-xs">frontend/.env</code>
          </li>
          <li>
            Backend demo page: set <code className="text-xs">PUBLIC_API_URL</code> in{" "}
            <code className="text-xs">backend/.env</code> (e.g. your production API domain)
          </li>
        </ul>
      </div>

      <div className="mb-6 rounded-xl border border-border bg-muted/40 p-4 text-sm space-y-2">
        <p className="font-medium">Local testing steps</p>
        <ol className="list-decimal list-inside text-muted-foreground space-y-1">
          <li>
            <Link to="/api-keys" className="font-medium text-foreground underline-offset-4 hover:underline">
              Create an API key
            </Link>{" "}
            and copy the <code className="text-xs">arag_…</code> value
          </li>
          <li>Replace <code className="text-xs">YOUR_arag_API_KEY</code> in the snippet</li>
          <li>
            Open the demo page:{" "}
            <a href={snippets.demo} target="_blank" rel="noreferrer" className="font-medium text-foreground underline-offset-4 hover:underline">
              {snippets.demo}
            </a>{" "}
            (after updating the key in embed-demo.html) or use the HTML snippet on your site
          </li>
        </ol>
      </div>

      <Tabs defaultValue="html">
        <TabsList>
          <TabsTrigger value="html">HTML</TabsTrigger>
          <TabsTrigger value="react">React</TabsTrigger>
          <TabsTrigger value="wordpress">WordPress</TabsTrigger>
          <TabsTrigger value="shopify">Shopify</TabsTrigger>
        </TabsList>
        {(["html", "react", "wordpress", "shopify"] as const).map((k) => (
          <TabsContent key={k} value={k} className="mt-4">
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                <span className="text-xs font-mono text-muted-foreground">{k}</span>
                <Button size="sm" variant="ghost" onClick={() => copy(k, snippets[k])}>
                  {copied === k ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied === k ? "Copied" : "Copy"}
                </Button>
              </div>
              <pre className="p-5 text-sm font-mono leading-relaxed overflow-x-auto text-foreground/90">
                <code>{snippets[k]}</code>
              </pre>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <div className="mt-8 grid md:grid-cols-3 gap-4">
        {[
          { title: "API Keys", desc: "Create and revoke embed keys.", to: "/api-keys" as const },
          { title: "Widget Builder", desc: "Customize colors and welcome text.", to: "/widget-builder" as const },
          { title: "Demo page", desc: "Test embed in isolation.", href: snippets.demo },
        ].map((g) => (
          g.to ? (
            <Link
              key={g.title}
              to={g.to}
              className="rounded-2xl border border-border bg-card p-5 hover:border-primary/30 hover:shadow-[var(--shadow-card)] transition-all"
            >
              <div className="font-display font-semibold flex items-center gap-2">
                {g.title} <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="text-sm text-muted-foreground mt-1">{g.desc}</div>
            </Link>
          ) : (
            <a
              key={g.title}
              href={g.href}
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl border border-border bg-card p-5 hover:border-primary/30 hover:shadow-[var(--shadow-card)] transition-all"
            >
              <div className="font-display font-semibold flex items-center gap-2">
                {g.title} <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="text-sm text-muted-foreground mt-1">{g.desc}</div>
            </a>
          )
        ))}
      </div>
    </div>
  );
}
