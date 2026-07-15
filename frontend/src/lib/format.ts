import { formatDistanceToNow } from "date-fns";

import type { DocumentRecord } from "@/api/types";

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getDocumentType(name: string): string {
  const ext = name.split(".").pop()?.toUpperCase() ?? "FILE";
  if (ext === "PDF") return "PDF";
  if (ext === "MD") return "MD";
  return ext;
}

export function formatAddedAt(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return "—";
  }
}

export type DocumentRow = {
  id: string;
  name: string;
  type: string;
  size: string;
  added: string;
  status: string;
  chunks: number;
};

export function toDocumentRow(doc: DocumentRecord): DocumentRow {
  return {
    id: doc.id,
    name: doc.original_name,
    type: getDocumentType(doc.original_name),
    size: formatFileSize(doc.size_bytes),
    added: formatAddedAt(doc.created_at),
    status: doc.status,
    chunks: doc.chunk_count,
  };
}
