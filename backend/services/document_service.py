"""Document upload and listing via existing DocumentManager."""

import re
import uuid
from pathlib import Path

from fastapi import UploadFile
from sqlalchemy.orm import Session

from backend.core.config import get_settings
from backend.models.document import Document
from backend.models.user import User
from backend.services.rag_service import get_document_manager, get_rag_lock

ALLOWED_SUFFIXES = {".pdf", ".md"}
MIME_BY_SUFFIX = {
    ".pdf": "application/pdf",
    ".md": "text/markdown",
}


def list_documents(db: Session, tenant_id: uuid.UUID) -> list[Document]:
    return (
        db.query(Document)
        .filter(Document.tenant_id == tenant_id)
        .order_by(Document.created_at.desc())
        .all()
    )


def get_document(db: Session, tenant_id: uuid.UUID, document_id: uuid.UUID) -> Document | None:
    return (
        db.query(Document)
        .filter(Document.id == document_id, Document.tenant_id == tenant_id)
        .first()
    )


async def upload_documents(
    db: Session,
    user: User,
    files: list[UploadFile],
) -> tuple[int, int, list[Document]]:
    settings = get_settings()
    upload_root = Path(settings.upload_dir)
    upload_root.mkdir(parents=True, exist_ok=True)

    pending: list[tuple[Document, Path]] = []

    for upload in files:
        if not upload.filename:
            continue
        suffix = Path(upload.filename).suffix.lower()
        if suffix not in ALLOWED_SUFFIXES:
            continue

        doc_id = uuid.uuid4()
        safe_name = f"{doc_id}{suffix}"
        dest = upload_root / safe_name
        content = await upload.read()
        dest.write_bytes(content)

        record = Document(
            id=doc_id,
            tenant_id=user.tenant_id,
            uploaded_by_id=user.id,
            file_name=Path(upload.filename).stem + suffix,
            original_name=upload.filename,
            mime_type=upload.content_type
            or MIME_BY_SUFFIX.get(suffix, "application/octet-stream"),
            size_bytes=len(content),
            status="processing",
            storage_key=str(dest),
        )
        db.add(record)
        pending.append((record, dest))

    if not pending:
        return 0, 0, []

    db.commit()
    for record, _ in pending:
        db.refresh(record)

    paths = [str(dest) for _, dest in pending]
    source_names = {str(dest): record.original_name for record, dest in pending}
    tenant_ids = {str(dest): str(record.tenant_id) for record, dest in pending}
    manager = get_document_manager()

    with get_rag_lock():
        added, skipped = manager.add_documents(
            paths, source_names=source_names, tenant_ids=tenant_ids
        )

    for record, dest in pending:
        stem = Path(record.storage_key).stem
        md_path = manager.markdown_dir / f"{stem}.md"
        if md_path.exists():
            record.status = "indexed"
            record.chunk_count = manager.count_chunks_for_path(record.storage_key)
        else:
            record.status = "skipped"
            record.chunk_count = 0
        db.add(record)

    db.commit()
    documents = [r for r, _ in pending]
    for record in documents:
        db.refresh(record)

    return added, skipped, documents


def delete_document(db: Session, tenant_id: uuid.UUID, document_id: uuid.UUID) -> bool:
    doc = get_document(db, tenant_id, document_id)
    if doc is None:
        return False

    storage = Path(doc.storage_key)
    if storage.is_file():
        storage.unlink(missing_ok=True)

    stem = Path(doc.storage_key).stem
    manager = get_document_manager()
    md_path = manager.markdown_dir / f"{stem}.md"
    if md_path.is_file():
        md_path.unlink(missing_ok=True)

    db.delete(doc)
    db.commit()
    return True
