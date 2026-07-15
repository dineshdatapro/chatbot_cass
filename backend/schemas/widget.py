from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class WidgetConfigSchema(BaseModel):
    name: str = "Aria Assistant"
    welcome: str = "Hi there! 👋 Ask me anything about our knowledge base."
    primaryColor: str = "#7c5cff"
    secondaryColor: str = "#0ea5e9"
    position: str = "bottom-right"
    fontFamily: str = "Inter"
    borderRadius: int = 20
    dark: bool = False
    suggestions: list[str] = Field(default_factory=lambda: ["What can you do?", "Search docs"])
    statusText: str = "Online — powered by Agentic RAG"
    logoUrl: str | None = None


class WidgetConfigResponse(BaseModel):
    bot_id: str
    config: WidgetConfigSchema


class WidgetSettingsUpdate(BaseModel):
    bot_id: str = "default"
    config: WidgetConfigSchema


class WidgetSettingsResponse(BaseModel):
    bot_id: str
    updated_at: datetime
    config: WidgetConfigSchema
