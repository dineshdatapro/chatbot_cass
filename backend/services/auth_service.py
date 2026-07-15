import re

from sqlalchemy.orm import Session

from backend.auth.jwt import create_access_token
from backend.auth.password import hash_password, verify_password
from backend.core.config import get_settings
from backend.models.tenant import Tenant
from backend.models.user import User
from backend.schemas.auth import RegisterRequest, TokenResponse, UserResponse


def _unique_slug(db: Session, company: str) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", company.lower()).strip("-") or "workspace"
    slug = base
    n = 0
    while db.query(Tenant).filter(Tenant.slug == slug).first() is not None:
        n += 1
        slug = f"{base}-{n}"
    return slug


def register(db: Session, body: RegisterRequest) -> TokenResponse:
    existing = db.query(User).filter(User.email == body.email.lower()).first()
    if existing is not None:
        raise ValueError("Email already registered")

    tenant = Tenant(name=body.company, slug=_unique_slug(db, body.company))
    db.add(tenant)
    db.flush()

    user = User(
        tenant_id=tenant.id,
        email=body.email.lower(),
        hashed_password=hash_password(body.password),
        full_name=body.full_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return _token_for_user(user)


def login(db: Session, email: str, password: str) -> TokenResponse:
    user = db.query(User).filter(User.email == email.lower()).first()
    if user is None or not verify_password(password, user.hashed_password):
        raise ValueError("Invalid email or password")
    if not user.is_active:
        raise ValueError("Account is disabled")
    return _token_for_user(user)


def _token_for_user(user: User) -> TokenResponse:
    settings = get_settings()
    token = create_access_token(
        user_id=user.id,
        tenant_id=user.tenant_id,
        email=user.email,
    )
    return TokenResponse(
        user=UserResponse.model_validate(user),
        access_token=token,
        expires_in=settings.access_token_expire_minutes * 60,
    )
