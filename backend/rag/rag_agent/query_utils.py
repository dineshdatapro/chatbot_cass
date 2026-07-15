"""Lightweight query normalization and intent heuristics before retrieval."""

import re
import unicodedata

# Short queries that should always go to retrieval (tenant-relative business topics).
BUSINESS_TOPIC_KEYWORDS = frozenset(
    {
        "course",
        "courses",
        "class",
        "classes",
        "training",
        "program",
        "programs",
        "fee",
        "fees",
        "price",
        "pricing",
        "cost",
        "contact",
        "phone",
        "email",
        "address",
        "location",
        "locations",
        "branch",
        "branches",
        "center",
        "centers",
        "centre",
        "centres",
        "office",
        "duration",
        "admission",
        "placement",
        "placements",
        "ceo",
        "mission",
        "vision",
        "about",
        "service",
        "services",
        "schedule",
        "timing",
        "timings",
        "batch",
        "batches",
        "certificate",
        "certification",
        "syllabus",
        "curriculum",
        "faculty",
        "trainer",
        "trainers",
    }
)

VAGUE_ONLY_QUERIES = frozenset(
    {
        "it",
        "that",
        "this",
        "them",
        "those",
        "these",
        "more",
        "continue",
        "go on",
        "tell me more",
        "explain more",
        "what about that",
        "and that",
    }
)

GREETING_PATTERNS = (
    re.compile(r"^(hi|hello|hey|hiya|howdy|good\s+(morning|afternoon|evening|day))\b", re.I),
    re.compile(r"^(greetings|sup)\b", re.I),
)

CAPABILITY_PATTERNS = (
    re.compile(r"\bwhat can you do\b", re.I),
    re.compile(r"\bhow can you help\b", re.I),
    re.compile(r"\bwhat do you do\b", re.I),
    re.compile(r"\bwhat are you capable of\b", re.I),
    re.compile(r"\bhow do you work\b", re.I),
    re.compile(r"\bwhat can you help me with\b", re.I),
)

IDENTITY_PATTERNS = (
    re.compile(r"\bwho are you\b", re.I),
    re.compile(r"\bwhat(?:'s| is) your name\b", re.I),
    re.compile(r"\bwhat are you\b", re.I),
)

THANKS_PATTERNS = (
    re.compile(r"^(thanks|thank you|thx|ty)\b", re.I),
    re.compile(r"\bthanks a lot\b", re.I),
    re.compile(r"\bmuch appreciated\b", re.I),
)

BYE_PATTERNS = (
    re.compile(r"^(bye|goodbye|see you|take care)\b", re.I),
    re.compile(r"\bhave a (?:good|nice) day\b", re.I),
)


def normalize_query(text: str) -> str:
    """Normalize whitespace, casing, and punctuation for retrieval."""
    if not text:
        return ""
    cleaned = unicodedata.normalize("NFKC", text).strip().lower()
    cleaned = re.sub(r"[^\w\s\-\?\.]", " ", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


def expand_short_query(query: str, conversation_summary: str = "") -> str:
    """Turn terse tenant-relative queries into self-contained retrieval queries."""
    normalized = normalize_query(query)
    if not normalized:
        return query.strip()

    if conversation_summary.strip() and normalized in VAGUE_ONLY_QUERIES:
        return f"{query.strip()} (in the context of our previous conversation)"

    words = set(normalized.split())
    if words & BUSINESS_TOPIC_KEYWORDS or len(normalized.split()) <= 6:
        if not re.search(r"\b(organization|company|institute|center|centre|you|your)\b", normalized):
            return f"{query.strip()} (about this organization)"
    return query.strip()


def is_likely_retrievable_without_clarification(query: str, conversation_summary: str = "") -> bool:
    """Heuristic: prefer retrieval over clarification for substantive short queries."""
    normalized = normalize_query(query)
    if not normalized or len(normalized) < 2:
        return False

    if normalized in VAGUE_ONLY_QUERIES:
        return bool(conversation_summary.strip())

    words = normalized.split()
    word_set = set(words)
    if len(words) == 1 and words[0] not in BUSINESS_TOPIC_KEYWORDS:
        return len(words[0]) >= 4

    if word_set & BUSINESS_TOPIC_KEYWORDS:
        return True

    if len(words) >= 2:
        return True

    return False


def detect_intent_heuristic(query: str) -> str | None:
    """Fast rule-based intent detection for common non-RAG queries."""
    text = query.strip()
    if not text:
        return None

    normalized = normalize_query(text)
    for pattern in GREETING_PATTERNS:
        if pattern.search(normalized) and len(normalized.split()) <= 6:
            return "greeting"

    for pattern in CAPABILITY_PATTERNS:
        if pattern.search(text):
            return "capability"

    for pattern in IDENTITY_PATTERNS:
        if pattern.search(text):
            return "identity"

    for pattern in THANKS_PATTERNS:
        if pattern.search(normalized):
            return "thanks"

    for pattern in BYE_PATTERNS:
        if pattern.search(normalized):
            return "bye"

    return None
