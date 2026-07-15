from pathlib import Path

from backend.rag.config import MARKDOWN_DIR
from backend.rag.utils import pdfs_to_markdowns, clear_directory_contents


class DocumentManager:

    def __init__(self, rag_system):
        self.rag_system = rag_system
        self.markdown_dir = Path(MARKDOWN_DIR)
        self.markdown_dir.mkdir(parents=True, exist_ok=True)

    def add_documents(self, document_paths, source_names=None, tenant_ids=None, progress_callback=None):
        print(f"Adding documents: {document_paths}")
        if not document_paths:
            return 0, 0

        source_names = source_names or {}
        tenant_ids = tenant_ids or {}

        document_paths = [document_paths] if isinstance(document_paths, str) else document_paths
        document_paths = [p for p in document_paths if p and Path(p).suffix.lower() in [".pdf", ".md"]]

        if not document_paths:
            return 0, 0

        added = 0
        skipped = 0

        for i, doc_path in enumerate(document_paths):
            if progress_callback:
                progress_callback((i + 1) / len(document_paths), f"Processing {Path(doc_path).name}")

            doc_name = Path(doc_path).stem
            md_path = self.markdown_dir / f"{doc_name}.md"

            if md_path.exists():
                skipped += 1
                continue

            try:
                if Path(doc_path).suffix.lower() == ".md":
                    md_path.write_bytes(Path(doc_path).read_bytes())
                else:
                    pdfs_to_markdowns(str(doc_path), overwrite=False)
                display_name = source_names.get(str(doc_path)) or source_names.get(doc_path)
                tenant_id = tenant_ids.get(str(doc_path)) or tenant_ids.get(doc_path)
                parent_chunks, child_chunks = self.rag_system.chunker.create_chunks_single(
                    md_path, source_name=display_name, tenant_id=tenant_id
                )

                if not child_chunks:
                    skipped += 1
                    continue

                collection = self.rag_system.vector_db.get_collection(self.rag_system.collection_name)
                collection.add_documents(child_chunks)
                self.rag_system.parent_store.save_many(parent_chunks)

                added += 1

            except Exception as e:
                print(f"Error processing {doc_path}: {e}")
                skipped += 1

        return added, skipped

    def count_chunks_for_path(self, document_path: str) -> int:
        """Return child chunk count for an uploaded file (by storage path stem)."""
        doc_name = Path(document_path).stem
        md_path = self.markdown_dir / f"{doc_name}.md"
        if not md_path.exists():
            return 0
        try:
            _, child_chunks = self.rag_system.chunker.create_chunks_single(md_path)
            return len(child_chunks)
        except Exception:
            return 0

    def is_indexed(self, document_path: str) -> bool:
        doc_name = Path(document_path).stem
        return (self.markdown_dir / f"{doc_name}.md").exists()

    def get_markdown_files(self):
        if not self.markdown_dir.exists():
            return []
        return sorted([p.name.replace(".md", ".pdf") for p in self.markdown_dir.glob("*.md")])

    def clear_all(self):
        self.markdown_dir.mkdir(parents=True, exist_ok=True)
        clear_directory_contents(self.markdown_dir)

        self.rag_system.parent_store.clear_store()
        self.rag_system.vector_db.delete_collection(self.rag_system.collection_name)
        self.rag_system.vector_db.create_collection(self.rag_system.collection_name)
