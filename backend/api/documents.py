from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from backend.api.deps import get_current_user
from backend.database.session import get_db
from backend.models.user import User
from backend.schemas.document import (
    DocumentListResponse,
    DocumentResponse,
    DocumentUploadResponse,
)
from backend.services import document_service
from backend.services.rag_service import is_rag_ready

router = APIRouter(prefix="/documents", tags=["documents"])


@router.get("", response_model=DocumentListResponse)
def list_documents(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    items = document_service.list_documents(db, user.tenant_id)
    return DocumentListResponse(
        items=[DocumentResponse.model_validate(d) for d in items],
        total=len(items),
    )


@router.post("/upload", response_model=DocumentUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_documents(
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not is_rag_ready():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="RAG system is not ready",
        )
    if not files:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No files provided")

    added, skipped, documents = await document_service.upload_documents(db, user, files)
    return DocumentUploadResponse(
        added=added,
        skipped=skipped,
        documents=[DocumentResponse.model_validate(d) for d in documents],
    )


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not document_service.delete_document(db, user.tenant_id, document_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
