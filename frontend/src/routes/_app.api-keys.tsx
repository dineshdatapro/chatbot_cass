import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Copy, Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { createApiKey, listApiKeys, revokeApiKey } from "@/api/apiKeys";
import { getApiErrorMessage } from "@/api/client";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_app/api-keys")({
  head: () => ({ meta: [{ title: "API Keys — AgenticRAG AI" }] }),
  component: Keys,
});

function Keys() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [revealedKey, setRevealedKey] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["api-keys"],
    queryFn: listApiKeys,
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => createApiKey(name),
    onSuccess: (res) => {
      setRevealedKey(res.api_key);
      setNewKeyName("");
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      toast.success("API key created — copy it now; it won't be shown again.");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const revokeMutation = useMutation({
    mutationFn: revokeApiKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      toast.success("API key revoked");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <PageHeader
        title="API Keys"
        subtitle="Keys authenticate the embed widget and server-side API calls on external sites."
        action={
          <Button variant="gradient" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> Create new key
          </Button>
        }
      />

      {isError && (
        <p className="text-sm text-destructive mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2">
          {getApiErrorMessage(error)}
        </p>
      )}

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <table className="w-full">
          <thead className="text-xs text-muted-foreground bg-muted/30">
            <tr>
              <th className="text-left font-medium px-4 py-3">Name</th>
              <th className="text-left font-medium px-4 py-3">Key</th>
              <th className="text-left font-medium px-4 py-3">Last used</th>
              <th className="text-left font-medium px-4 py-3">Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading &&
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={5} className="px-4 py-3">
                    <Skeleton className="h-8 w-full" />
                  </td>
                </tr>
              ))}
            {!isLoading && (data?.items.length ?? 0) === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No API keys yet. Create one for your embed snippet.
                </td>
              </tr>
            )}
            {data?.items.map((k) => (
              <tr key={k.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 text-sm font-medium">{k.name}</td>
                <td className="px-4 py-3 font-mono text-xs">{k.key_prefix}••••••••••••</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {k.last_used_at ? formatDistanceToNow(new Date(k.last_used_at), { addSuffix: true }) : "Never"}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(k.created_at), { addSuffix: true })}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      disabled={revokeMutation.isPending}
                      onClick={() => revokeMutation.mutate(k.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create API key</DialogTitle>
            <DialogDescription>
              Use this key in your embed snippet as <code className="text-xs">AGENTIC_RAG_API_KEY</code>.
            </DialogDescription>
          </DialogHeader>
          {!revealedKey ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="key-name">Name</Label>
                <Input
                  id="key-name"
                  placeholder="Production embed"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="gradient"
                  disabled={!newKeyName.trim() || createMutation.isPending}
                  onClick={() => createMutation.mutate(newKeyName.trim())}
                >
                  {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <div className="rounded-lg border border-border bg-muted/30 p-3 font-mono text-xs break-all">
                {revealedKey}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => copy(revealedKey)}>
                  <Copy className="h-4 w-4" /> Copy key
                </Button>
                <Button
                  onClick={() => {
                    setRevealedKey(null);
                    setCreateOpen(false);
                  }}
                >
                  Done
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
