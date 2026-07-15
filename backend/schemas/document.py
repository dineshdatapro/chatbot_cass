from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class DocumentResponse(BaseModel):
    id: UUID
    file_name: str
    original_name: str
    mime_type: str
    size_bytes: int
    status: str
    chunk_count: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DocumentListResponse(BaseModel):
    items: list[DocumentResponse]
    total: int


class DocumentUploadResponse(BaseModel):
    added: int
    skipped: int
    documents: list[DocumentResponse]
