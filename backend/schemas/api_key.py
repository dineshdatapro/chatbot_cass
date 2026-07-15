from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class ApiKeyCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=128)


class ApiKeyCreatedResponse(BaseModel):
    id: UUID
    name: str
    key_prefix: str
    api_key: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ApiKeyResponse(BaseModel):
    id: UUID
    name: str
    key_prefix: str
    is_active: bool
    last_used_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ApiKeyListResponse(BaseModel):
    items: list[ApiKeyResponse]
    total: int
