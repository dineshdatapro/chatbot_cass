import { rootClient } from "@/api/client";
import { listDocuments } from "@/api/documents";
import type { DashboardMetrics, HealthResponse } from "@/api/types";

export async function fetchHealth(): Promise<HealthResponse> {
  const { data } = await rootClient.get<HealthResponse>("/health");
  return data;
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const [health, documents] = await Promise.all([fetchHealth(), listDocuments()]);

  const indexedCount = documents.items.filter((d) => d.status === "indexed").length;

  return {
    documentCount: documents.total,
    indexedCount,
    ragReady: health.rag_ready,
    activeChatbots: health.rag_ready ? 1 : 0,
  };
}
