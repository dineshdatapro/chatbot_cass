import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles

from backend.api.embed import embed_demo

from backend.api.router import api_router
from backend.core.config import get_settings
from backend.database.session import init_db
from backend.services.rag_service import get_rag_system, is_rag_ready

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    logger.info("Initializing database...")
    try:
        init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.exception("Database init skipped")
    logger.info("Initializing RAG system (LangGraph)...")
    try:
        get_rag_system()
        logger.info("RAG system ready: %s", is_rag_ready())
    except Exception as e:
        logger.exception(
            "RAG system failed to start — chat and document indexing will return 503. "
            "Check RAG dependencies and Ollama/Qdrant setup."
        )
    yield
    logger.info("Shutting down API")


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title=settings.app_name,
        version="1.0.0",
        lifespan=lifespan,
        debug=settings.debug,
    )

    cors_kw: dict = {
        "allow_credentials": False,
        "allow_methods": ["*"],
        "allow_headers": [
            "Content-Type",
            "Accept",
            "Authorization",
            "X-API-Key",
            "ngrok-skip-browser-warning",
        ],
        "expose_headers": ["*"],
    }
    if settings.cors_allow_all:
        cors_kw["allow_origins"] = ["*"]
    else:
        cors_kw["allow_origins"] = settings.cors_origin_list
        cors_kw["allow_origin_regex"] = settings.cors_origin_regex

    app.add_middleware(CORSMiddleware, **cors_kw)

    @app.get("/health")
    def health():
        return {
            "status": "ok",
            "rag_ready": is_rag_ready(),
        }

    app.include_router(api_router, prefix=settings.api_v1_prefix)

    app.add_api_route(
        "/static/embed-demo.html",
        embed_demo,
        methods=["GET"],
        response_class=HTMLResponse,
    )

    static_dir = Path(__file__).resolve().parent / "static"
    static_dir.mkdir(exist_ok=True)
    app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

    return app


app = create_app()
