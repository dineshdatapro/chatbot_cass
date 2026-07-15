import os
from pathlib import Path
from pathlib import Path

CHILD_CHUNK_SIZE = 500
CHILD_CHUNK_OVERLAP = 100

MIN_PARENT_SIZE = 2000
MAX_PARENT_SIZE = 4000

HEADERS_TO_SPLIT_ON = [
    ("#", "Header 1"),
    ("##", "Header 2"),
    ("###", "Header 3"),
    ("####", "Header 4"),
]

MARKDOWN_DIR = Path("data/markdown")

_BASE_DIR = Path(__file__).resolve().parents[1]

# --- Directory Configuration ---
MARKDOWN_DIR = str(_BASE_DIR / "markdown_docs")
PARENT_STORE_PATH = str(_BASE_DIR / "parent_store")
QDRANT_DB_PATH = str(_BASE_DIR / "qdrant_db")

# --- Qdrant Configuration ---
CHILD_COLLECTION = "document_child_chunks"
SPARSE_VECTOR_NAME = "sparse"

# --- Embedding Model Configuration (vector store; not Ollama) ---
DENSE_MODEL = os.environ.get("DENSE_MODEL", "sentence-transformers/all-mpnet-base-v2")
SPARSE_MODEL = os.environ.get("SPARSE_MODEL", "Qdrant/bm25")
# LLM (ChatOllama) is configured via backend.core.config Settings / .env:
# OLLAMA_API_KEY, OLLAMA_BASE_URL, OLLAMA_MODEL, OLLAMA_TEMPERATURE

# --- Agent Configuration ---
MAX_TOOL_CALLS = 8
MAX_ITERATIONS = 10
GRAPH_RECURSION_LIMIT = 50
BASE_TOKEN_THRESHOLD = 2000
TOKEN_GROWTH_FACTOR = 0.9
HEADERS_TO_SPLIT_ON = [
    ("#", "H1"),
    ("##", "H2"),
    ("###", "H3"),
]

# --- Langfuse Observability ---
LANGFUSE_ENABLED = os.environ.get("LANGFUSE_ENABLED", "false").lower() == "true"
LANGFUSE_PUBLIC_KEY = os.environ.get("LANGFUSE_PUBLIC_KEY", "")
LANGFUSE_SECRET_KEY = os.environ.get("LANGFUSE_SECRET_KEY", "")
LANGFUSE_BASE_URL = os.environ.get("LANGFUSE_BASE_URL", "http://localhost:3000")
