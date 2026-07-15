import glob
import json
import os
import shutil
from pathlib import Path

from backend.rag.config import MARKDOWN_DIR


def clear_directory_contents(directory: Path) -> None:
    directory = Path(directory)
    if not directory.is_dir():
        return
    for child in directory.iterdir():
        if child.is_dir():
            shutil.rmtree(child)
        else:
            child.unlink(missing_ok=True)


def pdf_to_markdown(pdf_path, output_dir):
    try:
        import pymupdf
        import pymupdf4llm
    except ImportError as exc:
        raise ImportError(
            "PDF conversion requires pymupdf and pymupdf4llm."
        ) from exc

    doc = pymupdf.open(pdf_path)
    md = pymupdf4llm.to_markdown(
        doc,
        header=False,
        footer=False,
        page_separators=True,
        ignore_images=True,
        write_images=False,
        image_path=None,
    )
    md_cleaned = md.encode("utf-8", errors="surrogatepass").decode("utf-8", errors="ignore")
    output_path = Path(output_dir) / Path(doc.name).stem
    Path(output_path).with_suffix(".md").write_text(md_cleaned, encoding="utf-8")


def pdfs_to_markdowns(path_pattern, overwrite: bool = False):
    output_dir = Path(MARKDOWN_DIR)
    output_dir.mkdir(parents=True, exist_ok=True)

    for pdf_path in map(Path, glob.glob(path_pattern)):
        md_path = (output_dir / pdf_path.stem).with_suffix(".md")
        if overwrite or not md_path.exists():
            pdf_to_markdown(pdf_path, output_dir)


def estimate_context_tokens(messages: list) -> int:
    try:
        import tiktoken

        encoding = tiktoken.encoding_for_model("gpt-4")
    except Exception:
        try:
            import tiktoken

            encoding = tiktoken.get_encoding("cl100k_base")
        except Exception:
            return sum(len(str(getattr(msg, "content", ""))) for msg in messages)

    return sum(
        len(encoding.encode(str(getattr(msg, "content", ""))))
        for msg in messages
        if hasattr(msg, "content") and getattr(msg, "content") is not None
    )
