from dataclasses import dataclass
from uuid import UUID

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from backend.auth.api_key import verify_api_key
from backend.auth.jwt import decode_access_token
from backend.database.session import get_db
from backend.models.api_key import ApiKey
from backend.models.user import User

_bearer = HTTPBearer(auto_error=False)


@dataclass
class AuthContext:
    user: User
    tenant_id: UUID
    api_key_id: UUID | None = None


def _user_from_jwt(db: Session, token: str) -> User:
    payload = decode_access_token(token)
    user = db.query(User).filter(User.id == UUID(payload["sub"])).first()
    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")
    return user


def _user_from_api_key(db: Session, raw_key: str) -> tuple[User, ApiKey]:
    prefix = raw_key[:12] if len(raw_key) >= 12 else raw_key
    candidates = (
        db.query(ApiKey)
        .filter(ApiKey.key_prefix == prefix, ApiKey.is_active.is_(True))
        .all()
    )
    for record in candidates:
        if verify_api_key(raw_key, record.key_hash):
            user = db.query(User).filter(User.id == record.created_by_id).first()
            if user is None or not user.is_active:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="API key owner inactive")
            from datetime import datetime, timezone

            record.last_used_at = datetime.now(timezone.utc)
            db.commit()
            return user, record
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid API key")


def get_current_user(
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> User:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        return _user_from_jwt(db, credentials.credentials)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        ) from exc


def get_auth_context(
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    x_api_key: str | None = Header(default=None, alias="X-API-Key"),
) -> AuthContext:
    if credentials and credentials.scheme.lower() == "bearer":
        token = credentials.credentials
        if token.startswith("arag_"):
            user, api_key = _user_from_api_key(db, token)
            return AuthContext(user=user, tenant_id=user.tenant_id, api_key_id=api_key.id)
        try:
            user = _user_from_jwt(db, token)
            return AuthContext(user=user, tenant_id=user.tenant_id)
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc

    if x_api_key:
        user, api_key = _user_from_api_key(db, x_api_key.strip())
        return AuthContext(user=user, tenant_id=user.tenant_id, api_key_id=api_key.id)

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Provide Bearer JWT, Bearer API key (arag_...), or X-API-Key header",
    )
