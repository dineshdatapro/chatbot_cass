"""REST-facing chat service over existing ChatInterface + LangGraph."""

import json
import re
import uuid
from collections.abc import Generator
from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from pathlib import Path

from sqlalchemy.orm import Session

from backend.models.chat_message import ChatMessageRecord
from backend.models.chat_session import ChatSession
from backend.models.document import Document
from backend.models.user import User
from backend.schemas.chat import (
    ChatMessage,
    ChatResponse,
    ChatSessionDetail,
    ChatSessionListResponse,
    ChatSessionSummary,
    StoredChatMessage,
)
from backend.rag.tenant_context import bind_tenant_for_thread, load_tenant_allowed_sources
from backend.services.rag_service import get_chat_interface, get_rag_system, is_rag_ready

_FILE_NAME_RE = re.compile(r"File Name:\s*([^\n]+)", re.IGNORECASE)
_SOURCES_SECTION_RE = re.compile(r"\*\*Sources:\*\*\s*\n(.*?)(?:\n\n|\Z)", re.IGNORECASE | re.DOTALL)
_INTERNAL_NODES = frozenset({"rewrite_query", "summarize_history", "classify_intent"})


def _is_internal_message(msg: ChatMessage) -> bool:
    if msg.role != "assistant" or not msg.metadata:
        return False
    node = msg.metadata.get("node")
    if node in _INTERNAL_NODES:
        return True
    title = msg.metadata.get("title") or ""
    return isinstance(title, str) and title.startswith("🛠️")


def filter_public_messages(messages: list[ChatMessage]) -> list[ChatMessage]:
    return [m for m in messages if not _is_internal_message(m)]


def resolve_source_display_names(
    names: list[str], db: Session, tenant_id: UUID
) -> list[str]:
    resolved: list[str] = []
    seen: set[str] = set()
    for name in names:
        stem = Path(name).stem
        doc = (
            db.query(Document)
            .filter(
                Document.tenant_id == tenant_id,
                Document.storage_key.like(f"%{stem}%"),
            )
            .first()
        )
        display = doc.original_name if doc else name
        if display not in seen:
            seen.add(display)
            resolved.append(display)
    return sorted(resolved)


def extract_sources(
    messages: list[ChatMessage],
    db: Session | None = None,
    tenant_id: UUID | None = None,
) -> list[str]:
    found: set[str] = set()
    for msg in messages:
        content = msg.content or ""
        for match in _FILE_NAME_RE.finditer(content):
            name = match.group(1).strip()
            if name and name.lower() not in ("unknown", "n/a"):
                found.add(name)
        section = _SOURCES_SECTION_RE.search(content)
        if section:
            for line in section.group(1).splitlines():
                line = line.strip()
                if line.startswith("- "):
                    found.add(line[2:].strip())
    names = sorted(found)
    if db is not None and tenant_id is not None:
        return resolve_source_display_names(names, db, tenant_id)
    return names


def _normalize_messages(raw: Any) -> list[ChatMessage]:
    if isinstance(raw, str):
        return [ChatMessage(role="assistant", content=raw)]
    if not isinstance(raw, list):
        return []
    out: list[ChatMessage] = []
    for item in raw:
        if isinstance(item, dict) and "role" in item and "content" in item:
            out.append(
                ChatMessage(
                    role=item["role"],
                    content=item["content"],
                    metadata=item.get("metadata"),
                )
            )
    return out


def _main_assistant_text(messages: list[ChatMessage]) -> str:
    """Last plain assistant message (no collapsible metadata) — final answer."""
    for msg in reversed(messages):
        if msg.role != "assistant":
            continue
        if msg.metadata:
            node = msg.metadata.get("node")
            if node in ("rewrite_query", "summarize_history", "classify_intent"):
                continue
            if node == "clarification":
                return msg.content
            if msg.metadata.get("title", "").startswith("🛠️"):
                continue
        if msg.content and msg.content.strip():
            return strip_sources_section(msg.content.strip())
    return ""


def strip_sources_section(text: str) -> str:
    return re.sub(r"---\s*\n\*\*Sources:\*\*[\s\S]*$", "", text, flags=re.IGNORECASE).strip()


def get_or_create_session(
    db: Session,
    user: User,
    session_id: UUID | None,
) -> ChatSession:
    if session_id is not None:
        session = (
            db.query(ChatSession)
            .filter(
                ChatSession.id == session_id,
                ChatSession.user_id == user.id,
                ChatSession.tenant_id == user.tenant_id,
            )
            .first()
        )
        if session is not None:
            return session

    thread_id = str(uuid.uuid4())
    session = ChatSession(
        tenant_id=user.tenant_id,
        user_id=user.id,
        thread_id=thread_id,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def _persist_user_message(db: Session, session: ChatSession, content: str) -> ChatMessageRecord:
    record = ChatMessageRecord(
        session_id=session.id,
        role="user",
        content=content.strip(),
    )
    db.add(record)
    if not session.title:
        session.title = content.strip()[:80] or "New conversation"
    session.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(record)
    return record


def _persist_assistant_turn(
    db: Session,
    session: ChatSession,
    rag_messages: list[ChatMessage],
    sources: list[str],
) -> ChatMessageRecord | None:
    text = _main_assistant_text(rag_messages)
    if not text:
        return None

    record = ChatMessageRecord(
        session_id=session.id,
        role="assistant",
        content=text,
        sources=sources or None,
    )
    db.add(record)
    session.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(record)
    return record


def _run_chat_stream(
    message: str,
    thread_id: str,
    db: Session | None = None,
    user: User | None = None,
) -> Generator[list[ChatMessage], None, None]:
    if not is_rag_ready():
        yield [ChatMessage(role="assistant", content="RAG system is not initialized.")]
        return

    chat = get_chat_interface()

    if db is not None and user is not None:
        # Always set a set (possibly empty). Empty = tenant has no docs → deny all retrieval.
        allowed = load_tenant_allowed_sources(db, user.tenant_id)
    else:
        allowed = set()

    bind_tenant_for_thread(thread_id, allowed)
    try:
        # No global lock: thread_id is passed per request so chats run in parallel.
        for chunk in chat.chat(message, history=[], thread_id=thread_id):
            yield _normalize_messages(chunk)
    finally:
        bind_tenant_for_thread(thread_id, None)


def _graph_interrupted(thread_id: str) -> bool:
    if not is_rag_ready():
        return False
    rag = get_rag_system()
    cfg = rag.get_config(thread_id=thread_id)
    state = rag.agent_graph.get_state(cfg)
    return bool(state.next)


def list_sessions(db: Session, user: User) -> ChatSessionListResponse:
    sessions = (
        db.query(ChatSession)
        .filter(
            ChatSession.user_id == user.id,
            ChatSession.tenant_id == user.tenant_id,
        )
        .order_by(ChatSession.updated_at.desc())
        .all()
    )
    items: list[ChatSessionSummary] = []
    for s in sessions:
        last = (
            db.query(ChatMessageRecord)
            .filter(ChatMessageRecord.session_id == s.id)
            .order_by(ChatMessageRecord.created_at.desc())
            .first()
        )
        count = (
            db.query(ChatMessageRecord)
            .filter(ChatMessageRecord.session_id == s.id)
            .count()
        )
        items.append(
            ChatSessionSummary(
                id=s.id,
                thread_id=s.thread_id,
                title=s.title,
                created_at=s.created_at,
                updated_at=s.updated_at,
                last_message=last.content[:120] if last else None,
                message_count=count,
            )
        )
    return ChatSessionListResponse(items=items, total=len(items))


def get_session_detail(db: Session, user: User, session_id: UUID) -> ChatSessionDetail:
    session = (
        db.query(ChatSession)
        .filter(
            ChatSession.id == session_id,
            ChatSession.user_id == user.id,
            ChatSession.tenant_id == user.tenant_id,
        )
        .first()
    )
    if session is None:
        raise ValueError("Chat session not found")

    rows = (
        db.query(ChatMessageRecord)
        .filter(ChatMessageRecord.session_id == session.id)
        .order_by(ChatMessageRecord.created_at.asc())
        .all()
    )
    messages = [
        StoredChatMessage(
            id=r.id,
            role=r.role,
            content=r.content,
            metadata=r.metadata_,
            sources=r.sources,
            created_at=r.created_at,
        )
        for r in rows
    ]
    return ChatSessionDetail(
        id=session.id,
        thread_id=session.thread_id,
        title=session.title,
        created_at=session.created_at,
        updated_at=session.updated_at,
        messages=messages,
    )


def chat_sync(
    user_id: UUID,
    message: str,
    session_id: UUID | None,
) -> ChatResponse:
    """Run a non-streaming chat in the caller's thread (use via run_in_threadpool)."""
    from backend.database.session import get_session_factory

    db = get_session_factory()()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if user is None:
            raise ValueError("User not found")

        session = get_or_create_session(db, user, session_id)
        _persist_user_message(db, session, message)

        last_messages: list[ChatMessage] = []
        interrupted = False

        for batch in _run_chat_stream(message, session.thread_id, db, user):
            last_messages = batch
            for m in batch:
                if m.metadata and m.metadata.get("node") == "clarification":
                    interrupted = True

        sources = extract_sources(last_messages, db, user.tenant_id)
        _persist_assistant_turn(db, session, last_messages, sources)

        if not is_rag_ready():
            status = "error"
        elif interrupted:
            status = "interrupted"
        else:
            status = "completed"

        public_messages = filter_public_messages(last_messages)
        for m in public_messages:
            if m.role == "assistant" and not m.metadata:
                m.sources = sources if m.content == _main_assistant_text(last_messages) else m.sources

        return ChatResponse(
            session_id=session.id,
            thread_id=session.thread_id,
            status=status,
            interrupted=interrupted,
            messages=public_messages,
            sources=sources,
        )
    finally:
        db.close()


def chat_stream_sse(
    user_id: UUID,
    message: str,
    session_id: UUID | None,
) -> Generator[str, None, None]:
    """Sync SSE generator — Starlette runs this in a threadpool so chats parallelize.

    Opens its own DB session so it is safe under concurrent threadpool execution.
    """
    from backend.database.session import get_session_factory

    db = get_session_factory()()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if user is None:
            raise ValueError("User not found")

        session = get_or_create_session(db, user, session_id)
        _persist_user_message(db, session, message)

        meta = {
            "session_id": str(session.id),
            "thread_id": session.thread_id,
        }
        yield f"event: session\ndata: {json.dumps(meta)}\n\n"

        last_messages: list[ChatMessage] = []
        for batch in _run_chat_stream(message, session.thread_id, db, user):
            last_messages = batch
            public = filter_public_messages(last_messages)
            payload = {
                "messages": [m.model_dump() for m in public],
                "sources": [],
            }
            yield f"event: message\ndata: {json.dumps(payload)}\n\n"

        sources = extract_sources(filter_public_messages(last_messages), db, user.tenant_id)
        _persist_assistant_turn(db, session, last_messages, sources)

        interrupted = _graph_interrupted(session.thread_id)

        done = {
            "status": "interrupted" if interrupted else "completed",
            "interrupted": interrupted,
            "sources": [],
        }
        yield f"event: done\ndata: {json.dumps(done)}\n\n"
    except Exception as exc:
        payload = {"detail": str(exc)}
        yield f"event: error\ndata: {json.dumps(payload)}\n\n"
    finally:
        db.close()
