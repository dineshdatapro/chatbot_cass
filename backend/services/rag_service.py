"""Singleton wrapper around the backend-local RAG system."""

import threading
from typing import TYPE_CHECKING

from backend.core.rag_system import RAGSystem

if TYPE_CHECKING:
    from backend.core.chat_interface import ChatInterface
    from backend.core.document_manager import DocumentManager

_lock = threading.Lock()
_rag_system: "RAGSystem | None" = None
_document_manager: "DocumentManager | None" = None
_chat_interface: "ChatInterface | None" = None
_initialized = False


def get_rag_system() -> "RAGSystem":
    global _rag_system, _initialized
    if _rag_system is None:
        with _lock:
            if _rag_system is None:
                system = RAGSystem()
                system.initialize()
                _rag_system = system
                _initialized = True
    return _rag_system


from backend.core.chat_interface import ChatInterface
from backend.core.document_manager import DocumentManager


def get_document_manager() -> "DocumentManager":
    global _document_manager
    if _document_manager is None:
        with _lock:
            if _document_manager is None:
                _document_manager = DocumentManager(get_rag_system())
    return _document_manager


def get_chat_interface() -> "ChatInterface":
    global _chat_interface
    if _chat_interface is None:
        with _lock:
            if _chat_interface is None:
                _chat_interface = ChatInterface(get_rag_system())
    return _chat_interface


def is_rag_ready() -> bool:
    return _initialized and _rag_system is not None and _rag_system.agent_graph is not None


def get_rag_lock() -> threading.Lock:
    """Serialize access to the shared RAGSystem thread_id (process-wide singleton)."""
    return _lock
