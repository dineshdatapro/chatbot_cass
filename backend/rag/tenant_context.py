"""Per-request tenant scope for retrieval (shared RAG singleton, tenant-aware tools)."""

from contextvars import ContextVar
from pathlib import Path
from uuid import UUID

from sqlalchemy.orm import Session

from backend.models.document import Document

# None = scope not set (deny retrieval). Empty set = tenant has no docs (deny).
# Non-empty set = only those source names may be returned.
_allowed_sources: ContextVar[set[str] | None] = ContextVar("allowed_sources", default=None)


def set_tenant_allowed_sources(sources: set[str] | None) -> None:
    _allowed_sources.set(sources)


def get_tenant_allowed_sources() -> set[str] | None:
    return _allowed_sources.get()


def load_tenant_allowed_sources(db: Session, tenant_id: UUID) -> set[str]:
    """Build the set of source file names this tenant may retrieve from.

    Returns an empty set when the tenant has no indexed documents — callers must
    treat that as "no access", never as "unrestricted".
    """
    allowed: set[str] = set()
    docs = (
        db.query(Document)
        .filter(Document.tenant_id == tenant_id, Document.status == "indexed")
        .all()
    )
    for doc in docs:
        allowed.add(doc.original_name)
        stem = Path(doc.storage_key).stem
        suffix = Path(doc.original_name).suffix or ".pdf"
        allowed.add(f"{stem}{suffix}")
        allowed.add(stem)
        # Also allow tenant_id metadata match for newer indexed chunks
        allowed.add(str(tenant_id))
    return allowed


def chunk_source_allowed(source: str, allowed: set[str] | None) -> bool:
    """Return True only when source belongs to the current tenant's allow-list.

    Empty allow-list and unset scope both deny access (fail closed).
    """
    if allowed is None or len(allowed) == 0:
        return False
    if not source:
        return False
    name = Path(source).name
    stem = Path(source).stem
    return name in allowed or stem in allowed or source in allowed


def chunk_belongs_to_tenant(doc_metadata: dict, allowed: set[str] | None) -> bool:
    """Check chunk metadata against tenant allow-list (source and/or tenant_id)."""
    if allowed is None or len(allowed) == 0:
        return False
    tenant_meta = str(doc_metadata.get("tenant_id") or "")
    if tenant_meta and tenant_meta in allowed:
        return True
    return chunk_source_allowed(str(doc_metadata.get("source", "")), allowed)
