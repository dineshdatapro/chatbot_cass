from typing import List, Literal

from pydantic import BaseModel, Field

IntentType = Literal[
    "greeting",
    "capability",
    "identity",
    "thanks",
    "bye",
    "knowledge",
]


class IntentClassification(BaseModel):
    intent: IntentType = Field(
        description="Primary intent: greeting, capability, identity, thanks, bye, or knowledge."
    )
    confidence: float = Field(
        default=1.0,
        description="Confidence score between 0 and 1.",
    )


class QueryAnalysis(BaseModel):
    is_clear: bool = Field(
        description="True if the query can proceed to retrieval. Default to true for substantive questions."
    )
    questions: List[str] = Field(
        default_factory=list,
        description="List of rewritten, self-contained retrieval queries.",
    )
    clarification_needed: str = Field(
        default="",
        description="Only set when the query is genuinely ambiguous (e.g. pronouns with no context).",
    )
    normalized_query: str = Field(
        default="",
        description="Typo-corrected, normalized form of the user query.",
    )
