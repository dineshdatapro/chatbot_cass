import uuid

from backend.core.config import get_settings
from backend.rag.config import CHILD_COLLECTION, GRAPH_RECURSION_LIMIT
from backend.rag.db.vector_db_manager import VectorDbManager
from backend.rag.db.parent_store_manager import ParentStoreManager
from backend.rag.document_chunker import DocumentChuncker
from backend.core.observability import Observability


class RAGSystem:

    def __init__(self, collection_name: str = CHILD_COLLECTION):
        self.collection_name = collection_name
        self.vector_db = VectorDbManager()
        self.parent_store = ParentStoreManager()
        self.chunker = DocumentChuncker()
        self.observability = Observability()
        self.agent_graph = None
        self.thread_id = str(uuid.uuid4())
        self.recursion_limit = GRAPH_RECURSION_LIMIT

    def initialize(self):
        self.vector_db.create_collection(self.collection_name)
        collection = self.vector_db.get_collection(self.collection_name)

        try:
            from langchain_ollama import ChatOllama
        except ImportError as exc:
            raise ImportError(
                "langchain_ollama is required to initialize the RAG system."
            ) from exc

        try:
            from backend.rag.rag_agent.tools import ToolFactory
            from backend.rag.rag_agent.graph import create_agent_graph
        except ImportError as exc:
            raise ImportError(
                "RAG agent dependencies are required to initialize the RAG system."
            ) from exc

        settings = get_settings()
        settings.apply_ollama_env()

        if not settings.ollama_model:
            raise ValueError(
                "OLLAMA_MODEL is not set. Add it to backend/.env along with "
                "OLLAMA_API_KEY and OLLAMA_BASE_URL."
            )

        llm = ChatOllama(
            model=settings.ollama_model,
            temperature=settings.ollama_temperature,
        )
        tools = ToolFactory(collection).create_tools()
        self.agent_graph = create_agent_graph(llm, tools)

    def get_config(self, thread_id: str | None = None):
        """Build LangGraph config for a specific conversation thread.

        Pass thread_id explicitly so concurrent chats never share mutable
        state on this singleton. Falls back to self.thread_id for local/dev use.
        """
        tid = thread_id or self.thread_id
        cfg = {"configurable": {"thread_id": tid}, "recursion_limit": self.recursion_limit}
        handler = self.observability.get_handler()
        if handler:
            cfg["callbacks"] = [handler]
        return cfg

    def reset_thread(self, thread_id: str | None = None):
        tid = thread_id or self.thread_id
        try:
            self.agent_graph.checkpointer.delete_thread(tid)
        except Exception as e:
            print(f"Warning: Could not delete thread {tid}: {e}")
        if thread_id is None or thread_id == self.thread_id:
            self.thread_id = str(uuid.uuid4())
