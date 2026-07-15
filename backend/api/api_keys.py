from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.api.deps import get_current_user
from backend.database.session import get_db
from backend.models.user import User
from backend.schemas.api_key import ApiKeyCreateRequest, ApiKeyCreatedResponse, ApiKeyListResponse
from backend.services import api_key_service

router = APIRouter(prefix="/api-keys", tags=["api-keys"])


@router.get("", response_model=ApiKeyListResponse)
def list_keys(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return api_key_service.list_api_keys(db, user)


@router.post("", response_model=ApiKeyCreatedResponse, status_code=status.HTTP_201_CREATED)
def create_key(
    body: ApiKeyCreateRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return api_key_service.create_api_key(db, user, body.name)


@router.delete("/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_key(
    key_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not api_key_service.revoke_api_key(db, user, key_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="API key not found")
