from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.api.auth_context import AuthContext, get_auth_context, get_current_user
from backend.database.session import get_db
from backend.models.user import User
from backend.schemas.widget import WidgetConfigResponse, WidgetSettingsResponse, WidgetSettingsUpdate
from backend.services import widget_service

router = APIRouter(prefix="/widget", tags=["widget"])


@router.get("/config", response_model=WidgetConfigResponse)
def get_config(
    bot_id: str = Query(default="default"),
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_auth_context),
):
    return widget_service.get_widget_config(db, auth.tenant_id, bot_id)


@router.post("/settings", response_model=WidgetSettingsResponse)
def update_settings(
    body: WidgetSettingsUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return widget_service.save_widget_settings(db, user, body)
