from fastapi import APIRouter

from backend.api import api_keys, auth, chat, documents, embed, widget

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(chat.router)
api_router.include_router(documents.router)
api_router.include_router(api_keys.router)
api_router.include_router(widget.router)
api_router.include_router(embed.router)
