import glob
from pathlib import Path

from backend.rag.config import (
    CHILD_CHUNK_OVERLAP,
    CHILD_CHUNK_SIZE,
    HEADERS_TO_SPLIT_ON,
    MAX_PARENT_SIZE,
    MIN_PARENT_SIZE,
    MARKDOWN_DIR,
)


class DocumentChuncker:

    def __init__(self):
        try:
            from langchain_text_splitters import (
                MarkdownHeaderTextSplitter,
                RecursiveCharacterTextSplitter,
            )
        except ImportError as exc:
            raise ImportError(
                "langchain_text_splitters is required for document chunking"
            ) from exc

        self.__parent_splitter = MarkdownHeaderTextSplitter(
            headers_to_split_on=HEADERS_TO_SPLIT_ON,
            strip_headers=False,
        )
        self.__child_splitter = RecursiveCharacterTextSplitter(
            chunk_size=CHILD_CHUNK_SIZE,
            chunk_overlap=CHILD_CHUNK_OVERLAP,
        )
        self.__child_splitter_cls = RecursiveCharacterTextSplitter
        self.__min_parent_size = MIN_PARENT_SIZE
        self.__max_parent_size = MAX_PARENT_SIZE

    def create_chunks(self, path_dir=MARKDOWN_DIR):
        all_parent_chunks, all_child_chunks = [], []

        for doc_path_str in sorted(glob.glob(str(Path(path_dir) / "*.md"))):
            doc_path = Path(doc_path_str)
            parent_chunks, child_chunks = self.create_chunks_single(doc_path)
            all_parent_chunks.extend(parent_chunks)
            all_child_chunks.extend(child_chunks)

        return all_parent_chunks, all_child_chunks

    def create_chunks_single(self, md_path, source_name: str | None = None, tenant_id: str | None = None):
        doc_path = Path(md_path)

        with open(doc_path, "r", encoding="utf-8") as f:
            parent_chunks = self.__parent_splitter.split_text(f.read())

        merged_parents = self.__merge_small_parents(parent_chunks)
        split_parents = self.__split_large_parents(merged_parents)
        cleaned_parents = self.__clean_small_chunks(split_parents)

        all_parent_chunks, all_child_chunks = [], []
        self.__create_child_chunks(
            all_parent_chunks, all_child_chunks, cleaned_parents, doc_path, source_name, tenant_id
        )
        return all_parent_chunks, all_child_chunks

    def __merge_small_parents(self, chunks):
        if not chunks:
            return []

        merged, current = [], None

        for chunk in chunks:
            if current is None:
                current = chunk
            else:
                current.page_content += "\n\n" + chunk.page_content
                for k, v in chunk.metadata.items():
                    if k in current.metadata:
                        current.metadata[k] = f"{current.metadata[k]} -> {v}"
                    else:
                        current.metadata[k] = v

            if len(current.page_content) >= self.__min_parent_size:
                merged.append(current)
                current = None

        if current:
            if merged:
                merged[-1].page_content += "\n\n" + current.page_content
                for k, v in current.metadata.items():
                    if k in merged[-1].metadata:
                        merged[-1].metadata[k] = f"{merged[-1].metadata[k]} -> {v}"
                    else:
                        merged[-1].metadata[k] = v
            else:
                merged.append(current)

        return merged

    def __split_large_parents(self, chunks):
        split_chunks = []

        for chunk in chunks:
            if len(chunk.page_content) <= self.__max_parent_size:
                split_chunks.append(chunk)
            else:
                splitter = self.__child_splitter_cls(
                    chunk_size=self.__max_parent_size,
                    chunk_overlap=CHILD_CHUNK_OVERLAP,
                )
                sub_chunks = splitter.split_documents([chunk])
                split_chunks.extend(sub_chunks)

        return split_chunks

    def __clean_small_chunks(self, chunks):
        cleaned = []

        for i, chunk in enumerate(chunks):
            if len(chunk.page_content) < self.__min_parent_size:
                if cleaned:
                    cleaned[-1].page_content += "\n\n" + chunk.page_content
                    for k, v in chunk.metadata.items():
                        if k in cleaned[-1].metadata:
                            cleaned[-1].metadata[k] = f"{cleaned[-1].metadata[k]} -> {v}"
                        else:
                            cleaned[-1].metadata[k] = v
                elif i < len(chunks) - 1:
                    chunks[i + 1].page_content = chunk.page_content + "\n\n" + chunks[
                        i + 1
                    ].page_content
                    for k, v in chunk.metadata.items():
                        if k in chunks[i + 1].metadata:
                            chunks[i + 1].metadata[k] = (
                                f"{v} -> {chunks[i + 1].metadata[k]}"
                            )
                        else:
                            chunks[i + 1].metadata[k] = v
                else:
                    cleaned.append(chunk)
            else:
                cleaned.append(chunk)

        return cleaned

    def __create_child_chunks(self, all_parent_pairs, all_child_chunks, parent_chunks, doc_path, source_name=None, tenant_id=None):
        source_label = source_name or f"{doc_path.stem}.pdf"
        for i, p_chunk in enumerate(parent_chunks):
            parent_id = f"{doc_path.stem}_parent_{i}"
            metadata = {"source": source_label, "parent_id": parent_id}
            if tenant_id:
                metadata["tenant_id"] = tenant_id
            p_chunk.metadata.update(metadata)

            all_parent_pairs.append((parent_id, p_chunk))
            all_child_chunks.extend(self.__child_splitter.split_documents([p_chunk]))
