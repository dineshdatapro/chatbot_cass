import { apiClient } from "@/api/client";
import type { DocumentListResponse, DocumentUploadResponse } from "@/api/types";

export async function listDocuments(): Promise<DocumentListResponse> {
  const { data } = await apiClient.get<DocumentListResponse>("/documents");
  return data;
}

export async function uploadDocuments(
  files: File[],
  onProgress?: (percent: number) => void,
): Promise<DocumentUploadResponse> {
  const form = new FormData();
  for (const file of files) {
    form.append("files", file);
  }

  const { data } = await apiClient.post<DocumentUploadResponse>("/documents/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (event) => {
      if (!onProgress || !event.total) return;
      onProgress(Math.round((event.loaded / event.total) * 100));
    },
  });
  return data;
}

export async function deleteDocument(documentId: string): Promise<void> {
  await apiClient.delete(`/documents/${documentId}`);
}
