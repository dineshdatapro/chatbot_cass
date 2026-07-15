"""Helpers for grounded retrieval and safe fallback responses."""

from langchain_core.messages import ToolMessage

UNCERTAINTY_RESPONSE = "I'm sorry, but I don't have enough information to answer that accurately."

_NO_RESULT_MARKERS = frozenset(
    {
        "NO_RELEVANT_CHUNKS",
        "NO_PARENT_DOCUMENT",
        "NO_PARENT_DOCUMENTS",
    }
)


def is_empty_retrieval(content: str) -> bool:
    text = (content or "").strip()
    if not text:
        return True
    if text in _NO_RESULT_MARKERS:
        return True
    return text.startswith(("RETRIEVAL_ERROR", "PARENT_RETRIEVAL_ERROR"))


def messages_have_grounded_retrieval(messages, context_summary: str = "") -> bool:
    for msg in messages or []:
        if isinstance(msg, ToolMessage) and not is_empty_retrieval(str(msg.content)):
            if "Content:" in str(msg.content):
                return True
    summary = (context_summary or "").strip()
    if summary and "structured findings" in summary.lower():
        if "no relevant" not in summary.lower():
            return True
    return False
