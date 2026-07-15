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

    def get_config(self):
        cfg = {"configurable": {"thread_id": self.thread_id}, "recursion_limit": self.recursion_limit}
        handler = self.observability.get_handler()
        if handler:
            cfg["callbacks"] = [handler]
        return cfg

    def reset_thread(self):
        try:
            self.agent_graph.checkpointer.delete_thread(self.thread_id)
        except Exception as e:
            print(f"Warning: Could not delete thread {self.thread_id}: {e}")
        self.thread_id = str(uuid.uuid4())
