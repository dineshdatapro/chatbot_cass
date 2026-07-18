import os
from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

_BACKEND_DIR = Path(__file__).resolve().parents[1]
_WORKSPACE_ROOT = _BACKEND_DIR.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=_BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )
    # Langfuse
    langfuse_enabled: bool = False
    langfuse_public_key: str = ""
    langfuse_secret_key: str = ""
    langfuse_base_url: str = "https://cloud.langfuse.com"

    app_name: str = "Agentic RAG API"
    debug: bool = False
    api_v1_prefix: str = "/api/v1"

    # PostgreSQL
    database_url: str = "sqlite:///./agentic_rag.db"

    # JWT
    jwt_secret_key: str = "change-me-in-production-use-openssl-rand-hex-32"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    # CORS (comma-separated). Ignored when CORS_ALLOW_ALL=true.
    cors_allow_all: bool = True
    cors_origins: str = (
        "http://localhost:5173,"
        "http://localhost:3000,"
        "http://localhost:8080,"
        "http://127.0.0.1:5173,"
        "http://127.0.0.1:8080"
    )
    # Used when cors_allow_all=false
    cors_origin_regex: str = r"https?://.*"

    # Upload temp directory
    upload_dir: str = str(_BACKEND_DIR / "uploads")

    # Public API URL for embed widget snippets and demo page (set in production)
    public_api_url: str = ""

    # Online Ollama API (langchain_ollama ChatOllama)
    ollama_api_key: str = ""
    ollama_base_url: str = ""
    ollama_model: str = ""
    ollama_temperature: float = 0.7

    # Concurrent chat threads (Starlette/anyio default threadpool is ~40).
    # Keep uvicorn workers at 1: LangGraph uses in-memory checkpoints per process.
    chat_thread_limit: int = 40

    @property
    def embed_api_base_url(self) -> str:
        return self.public_api_url.rstrip("/") if self.public_api_url else ""

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    def apply_ollama_env(self) -> None:
        """Export Ollama cloud credentials for langchain_ollama / the Ollama client."""
        if self.ollama_api_key:
            os.environ["OLLAMA_API_KEY"] = self.ollama_api_key
        if self.ollama_base_url:
            os.environ["OLLAMA_HOST"] = self.ollama_base_url.rstrip("/")


@lru_cache
def get_settings() -> Settings:
    return Settings()
