from backend.rag.config import QDRANT_DB_PATH, DENSE_MODEL, SPARSE_MODEL, SPARSE_VECTOR_NAME


class VectorDbManager:
    def __init__(self):
        try:
            from qdrant_client import QdrantClient
            from langchain_huggingface import HuggingFaceEmbeddings
            from langchain_qdrant import FastEmbedSparse
        except ImportError as exc:
            raise ImportError(
                "Qdrant / Hugging Face vector store dependencies are required for VectorDbManager."
            ) from exc

        self.__client = QdrantClient(path=QDRANT_DB_PATH)
        self.__dense_embeddings = HuggingFaceEmbeddings(model_name=DENSE_MODEL)
        self.__sparse_embeddings = FastEmbedSparse(model_name=SPARSE_MODEL)

    def create_collection(self, collection_name):
        try:
            from qdrant_client.http import models as qmodels
        except ImportError as exc:
            raise ImportError(
                "qdrant_client is required to create Qdrant collections."
            ) from exc

        if not self.__client.collection_exists(collection_name):
            print(f"Creating collection: {collection_name}...")
            self.__client.create_collection(
                collection_name=collection_name,
                vectors_config=qmodels.VectorParams(
                    size=len(self.__dense_embeddings.embed_query("test")),
                    distance=qmodels.Distance.COSINE,
                ),
                sparse_vectors_config={
                    SPARSE_VECTOR_NAME: qmodels.SparseVectorParams(),
                },
            )
            print(f"✓ Collection created: {collection_name}")
        else:
            print(f"✓ Collection already exists: {collection_name}")

    def delete_collection(self, collection_name):
        try:
            if self.__client.collection_exists(collection_name):
                print(f"Removing existing Qdrant collection: {collection_name}")
                self.__client.delete_collection(collection_name)
        except Exception as e:
            print(f"Warning: could not delete collection {collection_name}: {e}")

    def get_collection(self, collection_name):
        try:
            from langchain_qdrant import QdrantVectorStore, RetrievalMode
        except ImportError as exc:
            raise ImportError(
                "langchain_qdrant is required to get a Qdrant collection."
            ) from exc

        try:
            return QdrantVectorStore(
                client=self.__client,
                collection_name=collection_name,
                embedding=self.__dense_embeddings,
                sparse_embedding=self.__sparse_embeddings,
                retrieval_mode=RetrievalMode.HYBRID,
                sparse_vector_name=SPARSE_VECTOR_NAME,
            )
        except Exception as e:
            print(f"Unable to get collection {collection_name}: {e}")
