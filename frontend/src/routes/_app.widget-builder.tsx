import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Save, Upload, Smartphone, Monitor, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getWidgetConfig, saveWidgetSettings } from "@/api/widget";
import { getApiErrorMessage } from "@/api/client";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChatWidget, defaultConfig, type WidgetConfig } from "@/components/ChatWidget";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/_app/widget-builder")({
  head: () => ({ meta: [{ title: "Widget Builder — AgenticRAG AI" }] }),
  component: Builder,
});

function Builder() {
  const [c, setC] = useState<WidgetConfig>(defaultConfig);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");

  const { data: saved } = useQuery({
    queryKey: ["widget-config"],
    queryFn: () => getWidgetConfig("default"),
  });

  useEffect(() => {
    if (saved?.config) setC(saved.config);
  }, [saved]);

  const saveMutation = useMutation({
    mutationFn: () => saveWidgetSettings(c, "default"),
    onSuccess: () => toast.success("Widget settings saved for embed"),
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const set = <K extends keyof WidgetConfig>(k: K, v: WidgetConfig[K]) => setC((p) => ({ ...p, [k]: v }));

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto">
      <PageHeader
        title="Widget Builder"
        subtitle="Design your chat widget with a live preview."
        action={
          <Button
            variant="gradient"
            disabled={saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
          >
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save changes
          </Button>
        }
      />

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          <Tabs defaultValue="general">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="appearance">Style</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="behavior">Behavior</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-5 mt-6">
              <Field label="Chatbot name"><Input value={c.name} onChange={(e) => set("name", e.target.value)} /></Field>
              <Field label="Status text"><Input value={c.statusText} onChange={(e) => set("statusText", e.target.value)} /></Field>
              <Field label="Logo upload">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 rounded-xl border border-dashed border-border flex items-center justify-center bg-muted/30">
                    {c.logoUrl ? <img src={c.logoUrl} className="h-full w-full object-cover rounded-xl" /> : <Upload className="h-5 w-5 text-muted-foreground" />}
                  </div>
                  <Button variant="outline" size="sm">Upload</Button>
                </div>
              </Field>
            </TabsContent>

            <TabsContent value="appearance" className="space-y-5 mt-6">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Primary color">
                  <div className="flex gap-2 items-center">
                    <input type="color" value={c.primaryColor} onChange={(e) => set("primaryColor", e.target.value)} className="h-10 w-12 rounded border border-border bg-transparent cursor-pointer" />
                    <Input value={c.primaryColor} onChange={(e) => set("primaryColor", e.target.value)} />
                  </div>
                </Field>
                <Field label="Secondary color">
                  <div className="flex gap-2 items-center">
                    <input type="color" value={c.secondaryColor} onChange={(e) => set("secondaryColor", e.target.value)} className="h-10 w-12 rounded border border-border bg-transparent cursor-pointer" />
                    <Input value={c.secondaryColor} onChange={(e) => set("secondaryColor", e.target.value)} />
                  </div>
                </Field>
              </div>
              <Field label="Font family">
                <Select value={c.fontFamily} onValueChange={(v) => set("fontFamily", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Inter", "System", "Georgia", "Helvetica", "Roboto"].map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label={`Border radius: ${c.borderRadius}px`}>
                <Slider value={[c.borderRadius]} max={40} step={1} onValueChange={([v]) => set("borderRadius", v)} />
              </Field>
              <Field label="Widget position">
                <Select value={c.position} onValueChange={(v) => set("position", v as WidgetConfig["position"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bottom-right">Bottom right</SelectItem>
                    <SelectItem value="bottom-left">Bottom left</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <div className="text-sm font-medium">Dark mode widget</div>
                  <div className="text-xs text-muted-foreground">Use a dark theme for the widget</div>
                </div>
                <Switch checked={c.dark} onCheckedChange={(v) => set("dark", v)} />
              </div>
            </TabsContent>

            <TabsContent value="content" className="space-y-5 mt-6">
              <Field label="Welcome message"><Textarea value={c.welcome} onChange={(e) => set("welcome", e.target.value)} rows={3} /></Field>
              <Field label="Suggested questions (one per line)">
                <Textarea value={c.suggestions.join("\n")} onChange={(e) => set("suggestions", e.target.value.split("\n").filter(Boolean))} rows={4} />
              </Field>
            </TabsContent>

            <TabsContent value="behavior" className="space-y-5 mt-6">
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div><div className="text-sm font-medium">Auto-open on first visit</div><div className="text-xs text-muted-foreground">Greet new visitors automatically</div></div>
                <Switch />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div><div className="text-sm font-medium">Sound on new message</div><div className="text-xs text-muted-foreground">Play a chime when bot replies</div></div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div><div className="text-sm font-medium">Allow human handoff</div><div className="text-xs text-muted-foreground">Let users escalate to your team</div></div>
                <Switch defaultChecked />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Preview */}
        <div className="rounded-2xl border border-border bg-card p-6 sticky top-24 self-start">
          <div className="flex items-center justify-between mb-4">
            <div className="font-display font-semibold">Live preview</div>
            <div className="flex border border-border rounded-lg p-0.5">
              <button onClick={() => setDevice("desktop")} className={`p-1.5 rounded ${device === "desktop" ? "bg-muted" : ""}`}><Monitor className="h-4 w-4" /></button>
              <button onClick={() => setDevice("mobile")} className={`p-1.5 rounded ${device === "mobile" ? "bg-muted" : ""}`}><Smartphone className="h-4 w-4" /></button>
            </div>
          </div>
          <div className="rounded-xl mesh-bg min-h-[600px] flex items-end justify-end p-8 relative overflow-hidden border border-border">
            <div className={device === "mobile" ? "scale-90" : ""}>
              <ChatWidget config={c} embedded defaultOpen />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{label}</Label>{children}</div>;
}
