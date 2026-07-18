from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from starlette.concurrency import run_in_threadpool

from backend.api.auth_context import AuthContext, get_auth_context
from backend.database.session import get_db
from backend.schemas.chat import ChatRequest, ChatResponse, ChatSessionDetail, ChatSessionListResponse
from backend.services import chat_service
from backend.services.rag_service import is_rag_ready

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=None, include_in_schema=True)
async def chat(
    body: ChatRequest,
    auth: AuthContext = Depends(get_auth_context),
):
    if not is_rag_ready():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="RAG system is not ready",
        )

    if body.stream:
        # Sync generator → Starlette runs it in a threadpool so multiple
        # embed/chat clients can progress in parallel without queueing.
        return StreamingResponse(
            chat_service.chat_stream_sse(auth.user.id, body.message, body.session_id),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            },
        )

    try:
        return await run_in_threadpool(
            chat_service.chat_sync, auth.user.id, body.message, body.session_id
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.get("/sessions", response_model=ChatSessionListResponse)
def list_chat_sessions(
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_auth_context),
):
    return chat_service.list_sessions(db, auth.user)


@router.get("/sessions/{session_id}", response_model=ChatSessionDetail)
def get_chat_session(
    session_id: UUID,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_auth_context),
):
    try:
        return chat_service.get_session_detail(db, auth.user, session_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
