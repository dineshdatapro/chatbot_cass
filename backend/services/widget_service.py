from sqlalchemy.orm import Session

from backend.models.user import User
from backend.models.widget_settings import WidgetSettings
from backend.schemas.widget import (
    WidgetConfigResponse,
    WidgetConfigSchema,
    WidgetSettingsResponse,
    WidgetSettingsUpdate,
)

DEFAULT_WIDGET_CONFIG = WidgetConfigSchema().model_dump()


def get_widget_config(db: Session, tenant_id, bot_id: str = "default") -> WidgetConfigResponse:
    row = (
        db.query(WidgetSettings)
        .filter(WidgetSettings.tenant_id == tenant_id, WidgetSettings.bot_id == bot_id)
        .first()
    )
    if row is None:
        return WidgetConfigResponse(bot_id=bot_id, config=WidgetConfigSchema())
    return WidgetConfigResponse(
        bot_id=row.bot_id,
        config=WidgetConfigSchema.model_validate(row.config),
    )


def save_widget_settings(db: Session, user: User, body: WidgetSettingsUpdate) -> WidgetSettingsResponse:
    row = (
        db.query(WidgetSettings)
        .filter(WidgetSettings.tenant_id == user.tenant_id, WidgetSettings.bot_id == body.bot_id)
        .first()
    )
    config_dict = body.config.model_dump()
    if row is None:
        row = WidgetSettings(
            tenant_id=user.tenant_id,
            bot_id=body.bot_id,
            config=config_dict,
        )
        db.add(row)
    else:
        row.config = config_dict
    db.commit()
    db.refresh(row)
    return WidgetSettingsResponse(
        bot_id=row.bot_id,
        updated_at=row.updated_at,
        config=WidgetConfigSchema.model_validate(row.config),
    )
