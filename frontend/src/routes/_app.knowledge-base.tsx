import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload, Search, FileText, Trash2, RefreshCw, MoreVertical, FileType, FileCode, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { deleteDocument, listDocuments, uploadDocuments } from "@/api/documents";
import { getApiErrorMessage } from "@/api/client";
import { toDocumentRow, type DocumentRow } from "@/lib/format";

export const Route = createFileRoute("/_app/knowledge-base")({
  head: () => ({ meta: [{ title: "Knowledge Base — AgenticRAG AI" }] }),
  component: KB,
});

const ACCEPTED_EXTENSIONS = [".pdf", ".md"];

function iconFor(t: string) {
  if (t === "PDF") return FileType;
  if (t === "MD") return FileCode;
  return FileText;
}

function filterAccepted(files: FileList | File[]): File[] {
  return Array.from(files).filter((f) => {
    const name = f.name.toLowerCase();
    return ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));
  });
}

function KB() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState(0);
  const [drag, setDrag] = useState(false);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["documents"],
    queryFn: listDocuments,
  });

  const docs: DocumentRow[] = useMemo(() => {
    const rows = (data?.items ?? []).map(toDocumentRow);
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((d) => d.name.toLowerCase().includes(q));
  }, [data?.items, search]);

  const uploadMutation = useMutation({
    mutationFn: (files: File[]) =>
      uploadDocuments(files, (percent) => setProgress(percent)),
    onSuccess: (result) => {
      setProgress(0);
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      toast.success(`Added ${result.added} document(s)${result.skipped ? `, skipped ${result.skipped}` : ""}`);
    },
    onError: (err) => {
      setProgress(0);
      toast.error(getApiErrorMessage(err));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      toast.success("Document removed");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
    onSettled: () => setDeletingId(null),
  });

  const handleFiles = (files: FileList | File[]) => {
    const accepted = filterAccepted(files);
    if (accepted.length === 0) {
      toast.error("Only PDF and Markdown (.md) files are supported.");
      return;
    }
    uploadMutation.mutate(accepted);
  };

  const openFilePicker = () => fileInputRef.current?.click();

  const uploading = uploadMutation.isPending;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Knowledge Base"
        subtitle="Train your AI on your docs. We support PDF, Markdown, TXT, and DOCX."
        action={
          <Button
            variant="gradient"
            onClick={openFilePicker}
            disabled={uploading}
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Upload Documents
          </Button>
        }
      />

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        multiple
        accept=".pdf,.md"
        onChange={(e) => {
          if (e.target.files?.length) handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
        }}
        onClick={openFilePicker}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") openFilePicker(); }}
        className={`rounded-2xl border-2 border-dashed p-12 text-center transition-colors mb-6 cursor-pointer ${drag ? "border-primary bg-primary/5" : "border-border bg-card"}`}
      >
        <div className="mx-auto h-14 w-14 rounded-2xl bg-[var(--gradient-primary)] flex items-center justify-center mb-4 shadow-[var(--shadow-glow)]">
          <Upload className="h-6 w-6 text-white" />
        </div>
        <div className="font-display font-semibold mb-1">Drop files here, or click to browse</div>
        <div className="text-sm text-muted-foreground mb-4">PDF, MD, TXT, DOCX up to 50MB each</div>
        {uploading && progress > 0 && (
          <div className="max-w-sm mx-auto">
            <Progress value={progress} />
            <div className="text-xs text-muted-foreground mt-2">Uploading and indexing… {progress}%</div>
          </div>
        )}
        {uploading && progress === 0 && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Processing…
          </div>
        )}
      </div>

      {isError && (
        <p className="text-sm text-destructive mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2">
          {getApiErrorMessage(error)}
        </p>
      )}

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="p-4 flex items-center gap-3 border-b border-border">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Reindex all
          </Button>
        </div>
        <table className="w-full">
          <thead className="text-xs text-muted-foreground bg-muted/30">
            <tr>
              <th className="text-left font-medium px-4 py-3">Document</th>
              <th className="text-left font-medium px-4 py-3">Size</th>
              <th className="text-left font-medium px-4 py-3">Chunks</th>
              <th className="text-left font-medium px-4 py-3">Added</th>
              <th className="text-left font-medium px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading &&
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={6} className="px-4 py-3">
                    <Skeleton className="h-10 w-full" />
                  </td>
                </tr>
              ))}
            {!isLoading && docs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  No documents yet. Upload PDF or Markdown files to build your knowledge base.
                </td>
              </tr>
            )}
            {!isLoading &&
              docs.map((d) => {
                const Icon = iconFor(d.type);
                const isDeleting = deletingId === d.id;
                return (
                  <tr key={d.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-sm font-medium">{d.name}</div>
                          <div className="text-xs text-muted-foreground">{d.type}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{d.size}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{d.chunks}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{d.added}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={d.status === "indexed" ? "secondary" : d.status === "skipped" ? "outline" : "default"}
                        className="capitalize"
                      >
                        {d.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => refetch()} disabled={isFetching}>
                          <RefreshCw className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={isDeleting || deleteMutation.isPending}
                          onClick={() => {
                            setDeletingId(d.id);
                            deleteMutation.mutate(d.id);
                          }}
                        >
                          {isDeleting ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-destructive" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          )}
                        </Button>
                        <Button size="icon" variant="ghost">
                          <MoreVertical className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
