import { createFileRoute } from "@tanstack/react-router";
import { UserPlus, MoreVertical } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_app/team")({
  head: () => ({ meta: [{ title: "Team — AgenticRAG AI" }] }),
  component: Team,
});

const members = [
  { name: "Ada Lovelace", email: "ada@acme.io", role: "Owner", joined: "Jan 12, 2026", status: "active" },
  { name: "Marcus Webb", email: "marcus@acme.io", role: "Admin", joined: "Feb 03, 2026", status: "active" },
  { name: "Priya Shah", email: "priya@acme.io", role: "Editor", joined: "Mar 18, 2026", status: "active" },
  { name: "Diego Ramos", email: "diego@acme.io", role: "Viewer", joined: "Apr 22, 2026", status: "pending" },
  { name: "Anna Lin", email: "anna@acme.io", role: "Editor", joined: "May 14, 2026", status: "active" },
];

function Team() {
  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <PageHeader title="Team Members" subtitle="Invite teammates and manage permissions."
        action={<Button variant="gradient"><UserPlus className="h-4 w-4" /> Invite member</Button>} />
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <table className="w-full">
          <thead className="text-xs text-muted-foreground bg-muted/30">
            <tr>
              <th className="text-left font-medium px-4 py-3">Member</th>
              <th className="text-left font-medium px-4 py-3">Role</th>
              <th className="text-left font-medium px-4 py-3">Joined</th>
              <th className="text-left font-medium px-4 py-3">Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {members.map((m) => (
              <tr key={m.email} className="hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-[var(--gradient-primary)] text-white text-xs font-semibold flex items-center justify-center">
                      {m.name.split(" ").map(p => p[0]).join("")}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{m.name}</div>
                      <div className="text-xs text-muted-foreground">{m.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Select defaultValue={m.role}>
                    <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Owner">Owner</SelectItem>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Editor">Editor</SelectItem>
                      <SelectItem value="Viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{m.joined}</td>
                <td className="px-4 py-3"><Badge variant={m.status === "active" ? "secondary" : "outline"} className="capitalize">{m.status}</Badge></td>
                <td className="px-4 py-3 text-right"><Button size="icon" variant="ghost"><MoreVertical className="h-4 w-4" /></Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
