import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/AuthShell";
import { register } from "@/api/auth";
import { getApiErrorMessage } from "@/api/client";
import { setAuth } from "@/lib/auth-storage";
import { Github, Chrome, Loader2 } from "lucide-react";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Create account — AgenticRAG AI" }] }),
  component: Register,
});

function Register() {
  const nav = useNavigate();
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await register({
        full_name: fullName,
        company,
        email,
        password,
      });
      setAuth(data.access_token, data.user);
      toast.success("Account created successfully!");
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
      title="Create your workspace"
      subtitle="Start your 14-day free trial. No credit card required."
      footer={<>Already have an account? <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link></>}
    >
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" type="button" disabled={loading}><Chrome className="h-4 w-4" /> Google</Button>
        <Button variant="outline" type="button" disabled={loading}><Github className="h-4 w-4" /> GitHub</Button>
      </div>
      <div className="relative text-center">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
        <span className="relative bg-background px-3 text-xs text-muted-foreground">or sign up with email</span>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="text-sm text-destructive rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2">
            {error}
          </p>
        )}
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            placeholder="Ada Lovelace"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="company">Company</Label>
          <Input
            id="company"
            placeholder="Acme Inc"
            required
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Work email</Label>
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
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="At least 8 characters"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
        </div>
        <Button type="submit" variant="gradient" className="w-full" disabled={loading}>
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating account…</> : "Create account"}
        </Button>
        <p className="text-xs text-muted-foreground text-center">By signing up you agree to our Terms and Privacy Policy.</p>
      </form>
    </AuthShell>
  );
}
