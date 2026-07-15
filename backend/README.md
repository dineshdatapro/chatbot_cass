# Agentic RAG — FastAPI Backend

REST API layer over the existing LangGraph RAG stack (`agentic-rag-for-dummies/project`). The core workflow is **not modified**; this package wraps `RAGSystem`, `DocumentManager`, and `ChatInterface`.

## Prerequisites

- PostgreSQL
- Python 3.11+
- RAG project dependencies (from `agentic-rag-for-dummies/requirements.txt`)
- Online Ollama API credentials in `backend/.env` (`OLLAMA_API_KEY`, `OLLAMA_BASE_URL`, `OLLAMA_MODEL`, `OLLAMA_TEMPERATURE`)
- Qdrant data paths as used by the RAG project

## Setup

From the repository root (`agentic-rag-for-dummies/`):

```bash
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r agentic-rag-for-dummies/requirements.txt
pip install -r backend/requirements.txt

cp backend/.env.example backend/.env
# Edit DATABASE_URL, JWT_SECRET_KEY, RAG_PROJECT_PATH

# Create DB (PostgreSQL)
createdb agentic_rag

# Run API (PYTHONPATH must include repo root)
set PYTHONPATH=%CD%
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints (`/api/v1`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No | Health + `rag_ready` |
| POST | `/auth/register` | No | Create tenant, user, return JWT |
| POST | `/auth/login` | No | Login, return JWT |
| POST | `/chat` | Bearer | Chat (JSON or SSE if `stream: true`) |
| GET | `/documents` | Bearer | List tenant documents |
| POST | `/documents/upload` | Bearer | Upload PDF/MD, index via RAG |
| DELETE | `/documents/{id}` | Bearer | Remove document record + markdown file |

### Chat example

```bash
TOKEN="..."
curl -X POST http://localhost:8000/api/v1/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "What is in the knowledge base?"}'
```

SSE streaming: set `"stream": true` in the body.

## Project layout

```
backend/
├── main.py           # FastAPI app, CORS, lifespan
├── api/              # Route handlers
├── auth/             # JWT + password hashing
├── services/         # RAG wrappers (rag, chat, document, auth)
├── models/           # SQLAlchemy: Tenant, User, ChatSession, Document
├── schemas/          # Pydantic request/response models
├── database/         # Engine, sessions, init_db
└── core/             # Settings, RAG import path loader
```
