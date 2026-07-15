from typing import List
from langchain_core.tools import tool
from backend.rag.db.parent_store_manager import ParentStoreManager
from backend.rag.rag_agent.query_utils import normalize_query
from backend.rag.tenant_context import (
    chunk_belongs_to_tenant,
    chunk_source_allowed,
    get_tenant_allowed_sources,
)


class ToolFactory:

    def __init__(self, collection):
        self.collection = collection
        self.parent_store_manager = ParentStoreManager()

    def _search_child_chunks(self, query: str, limit: int) -> str:
        """Search child chunks in the vector store and return the most relevant matches."""
        try:
            allowed = get_tenant_allowed_sources()
            # Fail closed: no tenant scope or tenant has zero indexed docs
            if allowed is None or len(allowed) == 0:
                return "NO_RELEVANT_CHUNKS"

            candidates = [query.strip()]
            normalized = normalize_query(query)
            if normalized and normalized not in candidates:
                candidates.append(normalized)

            results = []
            for candidate in candidates:
                for threshold in (0.7, 0.55, 0.4):
                    results = self.collection.similarity_search(
                        candidate, k=limit, score_threshold=threshold
                    )
                    if results:
                        break
                if results:
                    break

            if not results:
                return "NO_RELEVANT_CHUNKS"

            results = [
                doc
                for doc in results
                if chunk_belongs_to_tenant(doc.metadata or {}, allowed)
            ]
            if not results:
                return "NO_RELEVANT_CHUNKS"

            return "\n\n".join(
                [
                    f"Parent ID: {doc.metadata.get('parent_id', '')}\n"
                    f"File Name: {doc.metadata.get('source', '')}\n"
                    f"Content: {doc.page_content.strip()}"
                    for doc in results
                ]
            )

        except Exception as e:
            return f"RETRIEVAL_ERROR: {str(e)}"

    def _retrieve_many_parent_chunks(self, parent_ids: List[str]) -> str:
        """Retrieve multiple parent documents from a list of parent chunk IDs."""
        try:
            allowed = get_tenant_allowed_sources()
            if allowed is None or len(allowed) == 0:
                return "NO_PARENT_DOCUMENTS"

            ids = [parent_ids] if isinstance(parent_ids, str) else list(parent_ids)
            raw_parents = self.parent_store_manager.load_content_many(ids)
            if not raw_parents:
                return "NO_PARENT_DOCUMENTS"

            filtered = []
            for doc in raw_parents:
                meta = doc.get("metadata", {}) or {}
                source = str(meta.get("source", "unknown"))
                if chunk_belongs_to_tenant({**meta, "source": source}, allowed):
                    filtered.append(doc)

            if not filtered:
                return "NO_PARENT_DOCUMENTS"

            return "\n\n".join(
                [
                    f"Parent ID: {doc.get('parent_id', 'n/a')}\n"
                    f"File Name: {doc.get('metadata', {}).get('source', 'unknown')}\n"
                    f"Content: {doc.get('content', '').strip()}"
                    for doc in filtered
                ]
            )

        except Exception as e:
            return f"PARENT_RETRIEVAL_ERROR: {str(e)}"

    def _retrieve_parent_chunks(self, parent_id: str) -> str:
        """Retrieve the full parent document associated with a parent chunk ID."""
        try:
            allowed = get_tenant_allowed_sources()
            if allowed is None or len(allowed) == 0:
                return "NO_PARENT_DOCUMENT"

            parent = self.parent_store_manager.load_content(parent_id)
            if not parent:
                return "NO_PARENT_DOCUMENT"

            meta = parent.get("metadata", {}) or {}
            source = str(meta.get("source", "unknown"))
            if not chunk_belongs_to_tenant({**meta, "source": source}, allowed):
                return "NO_PARENT_DOCUMENT"

            return (
                f"Parent ID: {parent.get('parent_id', 'n/a')}\n"
                f"File Name: {source}\n"
                f"Content: {parent.get('content', '').strip()}"
            )

        except Exception as e:
            return f"PARENT_RETRIEVAL_ERROR: {str(e)}"

    def create_tools(self) -> List:
        search_tool = tool("search_child_chunks")(self._search_child_chunks)
        retrieve_tool = tool("retrieve_parent_chunks")(self._retrieve_parent_chunks)

        return [search_tool, retrieve_tool]
