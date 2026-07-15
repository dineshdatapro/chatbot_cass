import { getEmbedApiBaseUrl } from "@/lib/public-api-url";

export function buildEmbedSnippets(apiUrl: string = getEmbedApiBaseUrl()) {
  const base = apiUrl.replace(/\/$/, "");
  const widgetScript = `${base}/static/embed-widget.js`;

  return {
    html: `<!-- Agentic RAG embed (local or production API URL) -->
<script>
  window.AGENTIC_RAG_API = "${base}";
  window.AGENTIC_RAG_API_KEY = "YOUR_arag_API_KEY";
  window.AGENTIC_RAG_BOT_ID = "default";
</script>
<script async src="${widgetScript}"></script>`,
    react: `// Load once in your app root (e.g. index.html or layout)
useEffect(() => {
  (window as unknown as { AGENTIC_RAG_API: string }).AGENTIC_RAG_API = "${base}";
  (window as unknown as { AGENTIC_RAG_API_KEY: string }).AGENTIC_RAG_API_KEY = process.env.NEXT_PUBLIC_ARAG_API_KEY!;
  const s = document.createElement("script");
  s.src = "${widgetScript}";
  s.async = true;
  document.body.appendChild(s);
}, []);`,
    wordpress: `// Add to your theme's functions.php
function agenticrag_widget() {
  echo '<script>window.AGENTIC_RAG_API="${base}";</script>';
  echo '<script>window.AGENTIC_RAG_API_KEY="YOUR_arag_API_KEY";</script>';
  echo '<script>window.AGENTIC_RAG_BOT_ID="default";</script>';
  echo '<script async src="${widgetScript}"></script>';
}
add_action('wp_footer', 'agenticrag_widget');`,
    shopify: `<!-- In theme.liquid, before </body> -->
<script>window.AGENTIC_RAG_API = "${base}";</script>
<script>window.AGENTIC_RAG_API_KEY = "YOUR_arag_API_KEY";</script>
<script>window.AGENTIC_RAG_BOT_ID = "default";</script>
<script async src="${widgetScript}"></script>`,
    demo: `${base}/static/embed-demo.html`,
    apiBase: base,
  };
}
