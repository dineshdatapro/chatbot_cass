from uuid import UUID

from sqlalchemy.orm import Session

from backend.auth.api_key import generate_api_key
from backend.models.api_key import ApiKey
from backend.models.user import User
from backend.schemas.api_key import ApiKeyCreatedResponse, ApiKeyListResponse, ApiKeyResponse


def list_api_keys(db: Session, user: User) -> ApiKeyListResponse:
    rows = (
        db.query(ApiKey)
        .filter(ApiKey.tenant_id == user.tenant_id)
        .order_by(ApiKey.created_at.desc())
        .all()
    )
    return ApiKeyListResponse(
        items=[ApiKeyResponse.model_validate(r) for r in rows],
        total=len(rows),
    )


def create_api_key(db: Session, user: User, name: str) -> ApiKeyCreatedResponse:
    full_key, prefix, key_hash = generate_api_key()
    record = ApiKey(
        tenant_id=user.tenant_id,
        created_by_id=user.id,
        name=name,
        key_prefix=prefix,
        key_hash=key_hash,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return ApiKeyCreatedResponse(
        id=record.id,
        name=record.name,
        key_prefix=record.key_prefix,
        api_key=full_key,
        created_at=record.created_at,
    )


def revoke_api_key(db: Session, user: User, key_id: UUID) -> bool:
    record = (
        db.query(ApiKey)
        .filter(ApiKey.id == key_id, ApiKey.tenant_id == user.tenant_id)
        .first()
    )
    if record is None:
        return False
    db.delete(record)
    db.commit()
    return True
