import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/AuthShell";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset password — AgenticRAG AI" }] }),
  component: Forgot,
});

function Forgot() {
  const [sent, setSent] = useState(false);
  return (
    <AuthShell
      title="Reset your password"
      subtitle="We'll email you a secure reset link."
      footer={<>Remembered it? <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link></>}
    >
      {sent ? (
        <div className="rounded-xl border border-success/30 bg-success/10 p-6 text-center space-y-3">
          <CheckCircle2 className="h-10 w-10 text-success mx-auto" />
          <div className="font-medium">Check your inbox</div>
          <p className="text-sm text-muted-foreground">If an account exists for that email, we just sent a reset link.</p>
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@company.com" required />
          </div>
          <Button type="submit" variant="gradient" className="w-full">Send reset link</Button>
        </form>
      )}
    </AuthShell>
  );
}
