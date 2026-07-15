import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint, func
from sqlalchemy import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column

from backend.database.base import Base


class WidgetSettings(Base):
    __tablename__ = "widget_settings"
    __table_args__ = (UniqueConstraint("tenant_id", "bot_id", name="uq_widget_tenant_bot"),)

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    bot_id: Mapped[str] = mapped_column(String(64), default="default", nullable=False)
    config: Mapped[dict] = mapped_column(JSON, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
