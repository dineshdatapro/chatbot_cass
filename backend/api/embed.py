from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse

from backend.core.config import get_settings

router = APIRouter(tags=["embed"])


def _resolve_api_base(request: Request) -> str:
    settings = get_settings()
    if settings.embed_api_base_url:
        return settings.embed_api_base_url
    return str(request.base_url).rstrip("/")


@router.get("/embed-demo", response_class=HTMLResponse)
@router.get("/embed-demo.html", response_class=HTMLResponse)
def embed_demo(request: Request) -> HTMLResponse:
    api_base = _resolve_api_base(request)
    widget_src = f"{api_base}/static/embed-widget.js"
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Agentic RAG Embed Demo</title>
  <style>
    body {{ font-family: system-ui, sans-serif; max-width: 640px; margin: 48px auto; padding: 0 24px; }}
    code {{ background: #f4f4f5; padding: 2px 6px; border-radius: 4px; }}
  </style>
</head>
<body>
  <h1>Third-party page demo</h1>
  <p>API base: <code>{api_base}</code> (from <code>PUBLIC_API_URL</code> env or request host)</p>
  <script>
    window.AGENTIC_RAG_API = "{api_base}";
    window.AGENTIC_RAG_API_KEY = "YOUR_arag_API_KEY";
    window.AGENTIC_RAG_BOT_ID = "default";
  </script>
  <script async src="{widget_src}"></script>
</body>
</html>"""
    return HTMLResponse(html)
