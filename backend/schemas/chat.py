from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=32000)
    session_id: UUID | None = None
    stream: bool = False


class ChatMessage(BaseModel):
    role: str
    content: str
    metadata: dict[str, Any] | None = None
    sources: list[str] | None = None


class ChatResponse(BaseModel):
    session_id: UUID
    thread_id: str
    status: str
    interrupted: bool = False
    messages: list[ChatMessage]
    sources: list[str] = []


class StoredChatMessage(BaseModel):
    id: UUID
    role: str
    content: str
    metadata: dict[str, Any] | None = None
    sources: list[str] | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ChatSessionSummary(BaseModel):
    id: UUID
    thread_id: str
    title: str | None
    created_at: datetime
    updated_at: datetime
    last_message: str | None = None
    message_count: int = 0

    model_config = {"from_attributes": True}


class ChatSessionDetail(BaseModel):
    id: UUID
    thread_id: str
    title: str | None
    created_at: datetime
    updated_at: datetime
    messages: list[StoredChatMessage]


class ChatSessionListResponse(BaseModel):
    items: list[ChatSessionSummary]
    total: int
