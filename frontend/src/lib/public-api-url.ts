/**
 * Public API base URL for embed snippets and widget script tags.
 * Set VITE_EMBED_API_URL (preferred) or VITE_API_URL in frontend/.env
 */
export function getEmbedApiBaseUrl(): string {
  const fromEnv =
    import.meta.env.VITE_EMBED_API_URL?.trim() ||
    import.meta.env.VITE_API_URL?.trim() ||
    "";
  return fromEnv.replace(/\/$/, "") || "http://localhost:8000";
}

export function getEmbedApiEnvName(): string {
  if (import.meta.env.VITE_EMBED_API_URL?.trim()) return "VITE_EMBED_API_URL";
  if (import.meta.env.VITE_API_URL?.trim()) return "VITE_API_URL";
  return "VITE_EMBED_API_URL";
}
