# RAG ISOLATION MIGRATION - EXECUTIVE SUMMARY

## A. FILES THAT MUST BE MIGRATED (15 Critical Files)

### From: original_prototype/project/
### To: backend/rag/

```
CORE RAG SYSTEM:
  1. core/rag_system.py         → backend/rag/core/rag_system.py
  2. core/document_manager.py   → backend/rag/core/document_manager.py
  3. core/chat_interface.py     → backend/rag/core/chat_interface.py
  4. core/observability.py      → backend/rag/core/observability.py

DATABASE LAYER:
  5. db/vector_db_manager.py    → backend/rag/db/vector_db_manager.py
  6. db/parent_store_manager.py → backend/rag/db/parent_store_manager.py

AGENT & REASONING:
  7. rag_agent/graph.py         → backend/rag/rag_agent/graph.py
  8. rag_agent/nodes.py         → backend/rag/rag_agent/nodes.py
  9. rag_agent/edges.py         → backend/rag/rag_agent/edges.py
 10. rag_agent/tools.py         → backend/rag/rag_agent/tools.py
 11. rag_agent/graph_state.py   → backend/rag/rag_agent/graph_state.py
 12. rag_agent/schemas.py       → backend/rag/rag_agent/schemas.py
 13. rag_agent/prompts.py       → backend/rag/rag_agent/prompts.py

UTILITIES & CONFIG:
 14. config.py                  → backend/rag/config.py (REQUIRES PATH MODIFICATIONS)
 15. utils.py                   → backend/rag/utils.py

SUPPORTING (Package Structure):
 16. core/__init__.py           → backend/rag/core/__init__.py
 17. db/__init__.py             → backend/rag/db/__init__.py
 18. rag_agent/__init__.py      → backend/rag/rag_agent/__init__.py

DATA DIRECTORIES (MOVE/COPY):
 19. markdown_docs/             → backend/rag/markdown_docs/
 20. parent_store/              → backend/rag/parent_store/
 21. qdrant_db/                 → backend/rag/qdrant_db/
```

---

## B. FILES SAFE TO DELETE (After Migration Complete)

```
ENTIRELY SAFE TO DELETE:
├── original_prototype/project/ui/                  (UI only, not used by backend)
│   ├── gradio_app.py
│   ├── css.py
│   └── (other UI files)
├── original_prototype/project/assets/              (UI assets)
├── original_prototype/project/Dockerfile           (old standalone app)
├── original_prototype/project/app.py               (old Gradio entry)
├── original_prototype/project/README.md            (project-specific)
├── original_prototype/project/__pycache__/         (build artifact)
├── original_prototype/notebooks/                   (reference docs)
├── original_prototype/DETAILED_SEQUENCE_DIAGRAMS.puml
├── original_prototype/WORKFLOW_DOCUMENTATION.md
├── original_prototype/markdown_docs/               (moved to backend/rag/)
└── original_prototype/                             (entire directory)

KEEP:
├── original_prototype/LICENSE                      (legal requirement)
└── original_prototype/README.md                    (project history)
```

**Critical:** After moving `markdown_docs/`, `parent_store/`, and `qdrant_db/` to `backend/rag/`, delete the original directories in `original_prototype/project/`.

---

## C. EXACT IMPORT CHANGES REQUIRED (14 Import Updates)

### 1. backend/core/rag_loader.py (ELIMINATE sys.path hack)

**FROM:**
```python
import sys
from pathlib import Path
from backend.core.config import get_settings, _WORKSPACE_ROOT

def _resolve_rag_root() -> Path:
    raw = Path(get_settings().rag_project_path)
    if raw.is_absolute():
        return raw.resolve()
    return (_WORKSPACE_ROOT / raw).resolve()

def ensure_rag_project_on_path() -> Path:
    """Add the legacy `project/` package root to sys.path once."""
    global _loaded
    root = _resolve_rag_root()
    if not root.is_dir():
        raise RuntimeError(f"RAG project not found at {root}...")
    root_str = str(root)
    if root_str not in sys.path:
        sys.path.insert(0, root_str)  # ← HACK TO REMOVE
    _loaded = True
    return root

def load_rag_modules():
    """Return RAGSystem, DocumentManager, ChatInterface after path setup."""
    ensure_rag_project_on_path()
    from dotenv import load_dotenv
    load_dotenv(_resolve_rag_root() / ".env")

    from core.chat_interface import ChatInterface          # ← RELATIVE IMPORT
    from core.document_manager import DocumentManager      # ← RELATIVE IMPORT
    from core.rag_system import RAGSystem                  # ← RELATIVE IMPORT

    return RAGSystem, DocumentManager, ChatInterface
```

**TO:**
```python
from pathlib import Path

def load_rag_modules():
    """Return RAGSystem, DocumentManager, ChatInterface (backend-local)."""
    from dotenv import load_dotenv
    
    # Load RAG-specific environment variables
    rag_env_path = Path(__file__).parent.parent / "rag" / ".env"
    if rag_env_path.exists():
        load_dotenv(rag_env_path)

    from backend.rag.core.chat_interface import ChatInterface          # ← ABSOLUTE
    from backend.rag.core.document_manager import DocumentManager      # ← ABSOLUTE
    from backend.rag.core.rag_system import RAGSystem                  # ← ABSOLUTE

    return RAGSystem, DocumentManager, ChatInterface
```

**Changes:**
- Remove `sys` import
- Remove `_resolve_rag_root()` function
- Remove `ensure_rag_project_on_path()` function
- Remove `global _loaded` variable
- Update .env path to `backend/rag/.env`
- Convert all imports from relative to absolute (`backend.rag.*`)

---

### 2. backend/core/config.py (OPTIONAL - Can Remove)

**FROM:**
```python
# RAG project path (LangGraph stack — not modified by this backend)
rag_project_path: str = "original_prototype/project"
```

**TO (Option A - Remove completely):**
```python
# Removed - RAG system now backend-local
```

**TO (Option B - Update to new location):**
```python
# RAG project path (now backend-local)
rag_project_path: str = "backend/rag"  # Only used if needed for backward compatibility
```

---

### 3-16. backend/rag/**/*.py (ALL FILES - Convert Relative to Absolute)

**TEMPLATE FOR ALL RAG FILES:**

**FROM (e.g., backend/rag/core/rag_system.py):**
```python
import uuid
from langchain_ollama import ChatOllama
import config                                        # ← RELATIVE
from db.vector_db_manager import VectorDbManager    # ← RELATIVE
from db.parent_store_manager import ParentStoreManager  # ← RELATIVE
from document_chunker import DocumentChuncker       # ← RELATIVE
from rag_agent.tools import ToolFactory             # ← RELATIVE
from rag_agent.graph import create_agent_graph      # ← RELATIVE
from core.observability import Observability        # ← RELATIVE
```

**TO:**
```python
import uuid
from langchain_ollama import ChatOllama
from backend.rag import config                                           # ← ABSOLUTE
from backend.rag.db.vector_db_manager import VectorDbManager            # ← ABSOLUTE
from backend.rag.db.parent_store_manager import ParentStoreManager      # ← ABSOLUTE
from backend.rag.document_chunker import DocumentChuncker               # ← ABSOLUTE
from backend.rag.rag_agent.tools import ToolFactory                     # ← ABSOLUTE
from backend.rag.rag_agent.graph import create_agent_graph              # ← ABSOLUTE
from backend.rag.core.observability import Observability                # ← ABSOLUTE
```

**Applies to:**
- `backend/rag/core/rag_system.py`
- `backend/rag/core/document_manager.py`
- `backend/rag/core/chat_interface.py`
- `backend/rag/core/observability.py`
- `backend/rag/db/vector_db_manager.py`
- `backend/rag/db/parent_store_manager.py`
- `backend/rag/document_chunker.py`
- `backend/rag/rag_agent/graph.py`
- `backend/rag/rag_agent/nodes.py`
- `backend/rag/rag_agent/edges.py`
- `backend/rag/rag_agent/tools.py`
- `backend/rag/utils.py`

### 4. backend/rag/config.py (PATH MODIFICATIONS REQUIRED)

**FROM:**
```python
import os

# --- Directory Configuration ---
_BASE_DIR = os.path.dirname(os.path.dirname(__file__))

MARKDOWN_DIR = os.path.join(_BASE_DIR, "markdown_docs")
PARENT_STORE_PATH = os.path.join(_BASE_DIR, "parent_store")
QDRANT_DB_PATH = os.path.join(_BASE_DIR, "qdrant_db")
```

**TO:**
```python
import os
from pathlib import Path

# --- Directory Configuration ---
# _BASE_DIR now points to backend/rag/ directory (not original_prototype/project/)
_BASE_DIR = Path(__file__).parent

MARKDOWN_DIR = str(_BASE_DIR / "markdown_docs")
PARENT_STORE_PATH = str(_BASE_DIR / "parent_store")
QDRANT_DB_PATH = str(_BASE_DIR / "qdrant_db")
```

**Impact:** This changes where the RAG system looks for data directories:
- Before: `original_prototype/project/markdown_docs`
- After: `backend/rag/markdown_docs`

---

## D. BLOCKERS PREVENTING REMOVAL OF original_prototype

### Blocker 1: sys.path Injection (REMOVABLE ✓)
**Current Issue:** `backend/core/rag_loader.py` injects original_prototype/project into sys.path  
**Impact:** Cannot use relative imports if sys.path not manipulated  
**Solution:** Convert all imports to absolute paths (see Section C above)  
**Removal:** Delete `sys.path.insert()` call ✓

### Blocker 2: Hardcoded Path Reference (REMOVABLE ✓)
**Current Issue:** `backend/core/config.py` has `rag_project_path: str = "original_prototype/project"`  
**Impact:** rag_loader.py uses this to find RAG modules  
**Solution:** Change to `rag_project_path: str = "backend/rag"` OR remove entirely  
**Removal:** Update config value ✓

### Blocker 3: Relative Import Dependencies (REMOVABLE ✓)
**Current Issue:** All RAG modules use relative imports (e.g., `from config import ...`)  
**Impact:** These only work because original directory is on sys.path  
**Solution:** Convert ALL to absolute imports (`from backend.rag.config import ...`)  
**Removal:** Rewrite all 15 RAG files ✓

### Blocker 4: .env File Location (REMOVABLE ✓)
**Current Issue:** `rag_loader.py` looks for `.env` in original_prototype/project/  
**Impact:** Environment variables not loaded if moved  
**Solution:** Move `original_prototype/project/.env` → `backend/rag/.env`  
**Removal:** Copy .env file, update path ✓

### Blocker 5: Data Directories (REMOVABLE ✓)
**Current Issue:** Config paths point to original_prototype/project/ subdirectories  
**Impact:** markdown_docs/, parent_store/, qdrant_db/ won't be found  
**Solution:** Move data directories to backend/rag/ and update config.py  
**Removal:** Copy directories, update paths ✓

---

## MIGRATION SUMMARY

| Blocker | Root Cause | Fix | Difficulty |
|---------|------------|-----|------------|
| sys.path hack | `sys.path.insert()` in rag_loader.py | Remove + use absolute imports | LOW |
| Config path reference | `rag_project_path` in config.py | Update or remove | LOW |
| Relative imports | 15 RAG files use `from module import` | Rewrite to `from backend.rag.module import` | LOW |
| .env location | rag_loader.py loads from old path | Move file + update path reference | LOW |
| Data directories | Config uses original_prototype/ paths | Move dirs + update config.py | LOW |

---

## VERIFICATION AFTER MIGRATION

```
✓ No sys.path manipulation in any backend file
✓ No imports of 'config', 'db', 'core', 'rag_agent', 'document_chunker' 
  (all must be 'backend.rag.*')
✓ No file references to 'original_prototype' anywhere in backend/
✓ Data directories exist at: backend/rag/{markdown_docs,parent_store,qdrant_db}/
✓ .env file exists at: backend/rag/.env
✓ Backend starts: python main.py
✓ Health check passes: GET /health
✓ Chat works: POST /api/v1/chat/send
✓ Document upload works: POST /api/v1/documents/upload
✓ RAG system initialized: is_rag_ready() == True
✓ original_prototype/ can be deleted without error
```

---

## NEXT STEPS

1. **Review** this summary and the detailed DEPENDENCY_AUDIT_REPORT.md
2. **Create** backend/rag/ directory structure
3. **Copy** the 15 critical files from original_prototype/project/
4. **Update** all imports to use backend.rag.* (Section C)
5. **Move** data directories (markdown_docs, parent_store, qdrant_db)
6. **Move** .env file
7. **Update** backend/core/rag_loader.py (remove sys.path hack)
8. **Test** backend startup and endpoints
9. **Delete** original_prototype/ when all tests pass

**Estimated Time:** 1-2 hours (straightforward file copy + regex import replacement)
