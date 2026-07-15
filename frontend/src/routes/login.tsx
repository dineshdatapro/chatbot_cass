import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/AuthShell";
import { login } from "@/api/auth";
import { getApiErrorMessage } from "@/api/client";
import { setAuth } from "@/lib/auth-storage";
import { Github, Chrome, Loader2 } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — AgenticRAG AI" }] }),
  component: Login,
});

function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await login({ email, password });
      setAuth(data.access_token, data.user);
      toast.success("Welcome back!");
      await nav({ to: "/dashboard" });
    } catch (err) {
      const message = getApiErrorMessage(err);
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your AgenticRAG workspace."
      footer={<>Don't have an account? <Link to="/register" className="text-primary font-medium hover:underline">Sign up</Link></>}
    >
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" type="button" disabled={loading}><Chrome className="h-4 w-4" /> Google</Button>
        <Button variant="outline" type="button" disabled={loading}><Github className="h-4 w-4" /> GitHub</Button>
      </div>
      <div className="relative text-center">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
        <span className="relative bg-background px-3 text-xs text-muted-foreground">or continue with email</span>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="text-sm text-destructive rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2">
            {error}
          </p>
        )}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@company.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground">Forgot?</Link>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
        </div>
        <Button type="submit" variant="gradient" className="w-full" disabled={loading}>
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</> : "Sign in"}
        </Button>
      </form>
    </AuthShell>
  );
}
