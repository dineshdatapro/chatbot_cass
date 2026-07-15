from typing import Literal, Set

from langchain_core.messages import SystemMessage, HumanMessage, RemoveMessage, AIMessage, ToolMessage
from langgraph.types import Command

from backend.rag.config import BASE_TOKEN_THRESHOLD, TOKEN_GROWTH_FACTOR
from backend.rag.utils import estimate_context_tokens
from .graph_state import State, AgentState
from .schemas import QueryAnalysis, IntentClassification
from .query_utils import (
    detect_intent_heuristic,
    expand_short_query,
    is_likely_retrievable_without_clarification,
    normalize_query,
)
from .prompts import *
from .retrieval_utils import UNCERTAINTY_RESPONSE, messages_have_grounded_retrieval


def summarize_history(state: State, llm):
    if len(state["messages"]) < 4:
        return {"conversation_summary": ""}

    relevant_msgs = [
        msg for msg in state["messages"][:-1]
        if isinstance(msg, (HumanMessage, AIMessage)) and not getattr(msg, "tool_calls", None)
    ]

    if not relevant_msgs:
        return {"conversation_summary": ""}

    conversation = "Conversation history:\n"
    for msg in relevant_msgs[-6:]:
        role = "User" if isinstance(msg, HumanMessage) else "Assistant"
        conversation += f"{role}: {msg.content}\n"

    summary_response = llm.with_config(temperature=0.2).invoke([
        SystemMessage(content=get_conversation_summary_prompt()),
        HumanMessage(content=conversation),
    ])
    return {
        "conversation_summary": summary_response.content,
        "agent_answers": [{"__reset__": True}],
    }


def classify_intent(state: State, llm):
    last_message = state["messages"][-1]
    query = last_message.content.strip()
    conversation_summary = state.get("conversation_summary", "")

    heuristic = detect_intent_heuristic(query)
    if heuristic:
        return {
            "intent": heuristic,
            "skip_rag": True,
        }

    context_section = (
        (f"Conversation Context:\n{conversation_summary}\n\n" if conversation_summary.strip() else "")
        + f"User Message:\n{query}\n"
    )

    llm_with_structure = llm.with_config(temperature=0).with_structured_output(IntentClassification)
    response = llm_with_structure.invoke([
        SystemMessage(content=get_intent_classification_prompt()),
        HumanMessage(content=context_section),
    ])

    intent = response.intent if response.confidence >= 0.6 else "knowledge"
    skip_rag = intent != "knowledge"

    return {
        "intent": intent,
        "skip_rag": skip_rag,
    }


def direct_response(state: State, llm):
    last_message = state["messages"][-1]
    intent = state.get("intent", "greeting")
    conversation_summary = state.get("conversation_summary", "")

    context = ""
    if conversation_summary.strip():
        context = f"Conversation context:\n{conversation_summary}\n\n"

    response = llm.with_config(temperature=0.3).invoke([
        SystemMessage(content=get_direct_response_prompt(intent)),
        HumanMessage(content=f"{context}User: {last_message.content}"),
    ])
    return {"messages": [AIMessage(content=response.content)]}


def rewrite_query(state: State, llm):
    last_message = state["messages"][-1]
    conversation_summary = state.get("conversation_summary", "")
    raw_query = last_message.content.strip()

    context_section = (
        (f"Conversation Context:\n{conversation_summary}\n" if conversation_summary.strip() else "")
        + f"User Query:\n{raw_query}\n"
    )

    llm_with_structure = llm.with_config(temperature=0.1).with_structured_output(QueryAnalysis)
    response = llm_with_structure.invoke([
        SystemMessage(content=get_rewrite_query_prompt()),
        HumanMessage(content=context_section),
    ])

    force_clear = is_likely_retrievable_without_clarification(raw_query, conversation_summary)
    is_clear = response.is_clear or force_clear

    if is_clear:
        questions = response.questions or []
        if not questions:
            expanded = expand_short_query(raw_query, conversation_summary)
            normalized = response.normalized_query.strip() if response.normalized_query else normalize_query(raw_query)
            primary = expanded if expanded != raw_query else (normalized or raw_query)
            questions = [primary]

        delete_all = [RemoveMessage(id=m.id) for m in state["messages"] if not isinstance(m, SystemMessage)]
        return {
            "questionIsClear": True,
            "messages": delete_all,
            "originalQuery": raw_query,
            "rewrittenQuestions": questions[:3],
        }

    clarification = (
        response.clarification_needed
        if response.clarification_needed and len(response.clarification_needed.strip()) > 10
        else "Could you share a bit more detail so I can help you better?"
    )
    return {
        "questionIsClear": False,
        "messages": [AIMessage(content=clarification)],
    }


def request_clarification(state: State):
    return {}


# --- Agent Nodes ---

def orchestrator(state: AgentState, llm_with_tools):
    context_summary = state.get("context_summary", "").strip()
    sys_msg = SystemMessage(content=get_orchestrator_prompt())
    summary_injection = (
        [HumanMessage(content=f"[COMPRESSED CONTEXT FROM PRIOR RESEARCH]\n\n{context_summary}")] if context_summary else []
    )
    if not state.get("messages"):
        human_msg = HumanMessage(content=state["question"])
        force_search = HumanMessage(
            content=(
                "Search the organization's information first using 'search_child_chunks'. "
                "Try the query and reasonable rephrasings if needed. "
                "If search returns NO_RELEVANT_CHUNKS, do NOT answer from general knowledge or guess. "
                "Respond only with: I'm sorry, but I don't have enough information to answer that accurately."
            )
        )
        response = llm_with_tools.invoke([sys_msg] + summary_injection + [human_msg, force_search])
        return {
            "messages": [human_msg, response],
            "tool_call_count": len(response.tool_calls or []),
            "iteration_count": 1,
        }

    response = llm_with_tools.invoke([sys_msg] + summary_injection + state["messages"])
    tool_calls = response.tool_calls if hasattr(response, "tool_calls") else []
    return {
        "messages": [response],
        "tool_call_count": len(tool_calls) if tool_calls else 0,
        "iteration_count": 1,
    }


def fallback_response(state: AgentState, llm):
    seen = set()
    unique_contents = []
    for m in state["messages"]:
        if isinstance(m, ToolMessage) and m.content not in seen:
            unique_contents.append(m.content)
            seen.add(m.content)

    context_summary = state.get("context_summary", "").strip()

    context_parts = []
    if context_summary:
        context_parts.append(f"## Compressed Research Context (from prior iterations)\n\n{context_summary}")
    if unique_contents:
        context_parts.append(
            "## Retrieved Data (current iteration)\n\n"
            + "\n\n".join(
                f"--- DATA SOURCE {i} ---\n{content}" for i, content in enumerate(unique_contents, 1)
            )
        )

    has_retrieved_data = messages_have_grounded_retrieval(state.get("messages", []), context_summary)

    context_text = "\n\n".join(context_parts) if context_parts else "No relevant organizational information was found."

    prompt_content = (
        f"USER QUERY: {state.get('question')}\n\n"
        f"{context_text}\n\n"
        f"RELEVANT DATA FOUND: {has_retrieved_data}\n\n"
        "INSTRUCTION:\n"
        "If RELEVANT DATA FOUND is False, respond ONLY with: "
        "I'm sorry, but I don't have enough information to answer that accurately. "
        "Never invent locations, companies, or facts. Never use general world knowledge."
    )
    response = llm.invoke([
        SystemMessage(content=get_fallback_response_prompt()),
        HumanMessage(content=prompt_content),
    ])
    answer = response.content
    if not has_retrieved_data:
        answer = UNCERTAINTY_RESPONSE
    return {"messages": [AIMessage(content=answer)]}


def should_compress_context(state: AgentState) -> Command[Literal["compress_context", "orchestrator"]]:
    messages = state["messages"]

    new_ids: Set[str] = set()
    for msg in reversed(messages):
        if isinstance(msg, AIMessage) and getattr(msg, "tool_calls", None):
            for tc in msg.tool_calls:
                if tc.get("name") == "retrieve_parent_chunks":
                    raw = tc["args"].get("parent_id") or tc["args"].get("id") or tc["args"].get("ids") or []
                    if isinstance(raw, str):
                        new_ids.add(f"parent::{raw}")
                    else:
                        new_ids.update(f"parent::{r}" for r in raw)

                elif tc.get("name") == "search_child_chunks":
                    query = tc["args"].get("query", "")
                    if query:
                        new_ids.add(f"search::{query}")
            break

    updated_ids = state.get("retrieval_keys", set()) | new_ids

    current_token_messages = estimate_context_tokens(messages)
    current_token_summary = estimate_context_tokens([HumanMessage(content=state.get("context_summary", ""))])
    current_tokens = current_token_messages + current_token_summary

    max_allowed = BASE_TOKEN_THRESHOLD + int(current_token_summary * TOKEN_GROWTH_FACTOR)

    goto = "compress_context" if current_tokens > max_allowed else "orchestrator"
    return Command(update={"retrieval_keys": updated_ids}, goto=goto)


def compress_context(state: AgentState, llm):
    messages = state["messages"]
    existing_summary = state.get("context_summary", "").strip()

    if not messages:
        return {}

    conversation_text = f"USER QUESTION:\n{state.get('question')}\n\nConversation to compress:\n\n"
    if existing_summary:
        conversation_text += f"[PRIOR COMPRESSED CONTEXT]\n{existing_summary}\n\n"

    for msg in messages[1:]:
        if isinstance(msg, AIMessage):
            tool_calls_info = ""
            if getattr(msg, "tool_calls", None):
                calls = ", ".join(f"{tc['name']}({tc['args']})" for tc in msg.tool_calls)
                tool_calls_info = f" | Tool calls: {calls}"
            conversation_text += f"[ASSISTANT{tool_calls_info}]\n{msg.content or '(tool call only)'}\n\n"
        elif isinstance(msg, ToolMessage):
            tool_name = getattr(msg, "name", "tool")
            conversation_text += f"[TOOL RESULT — {tool_name}]\n{msg.content}\n\n"

    summary_response = llm.invoke([
        SystemMessage(content=get_context_compression_prompt()),
        HumanMessage(content=conversation_text),
    ])
    new_summary = summary_response.content

    retrieved_ids: Set[str] = state.get("retrieval_keys", set())
    if retrieved_ids:
        parent_ids = sorted(r for r in retrieved_ids if r.startswith("parent::"))
        search_queries = sorted(r.replace("search::", "") for r in retrieved_ids if r.startswith("search::"))

        block = "\n\n---\n**Already executed (do NOT repeat):**\n"
        if parent_ids:
            block += "Parent chunks retrieved:\n" + "\n".join(f"- {p.replace('parent::', '')}" for p in parent_ids) + "\n"
        if search_queries:
            block += "Search queries already run:\n" + "\n".join(f"- {q}" for q in search_queries) + "\n"
        new_summary += block

    return {"context_summary": new_summary, "messages": [RemoveMessage(id=m.id) for m in messages[1:]]}


def collect_answer(state: AgentState):
    last_message = state["messages"][-1]
    is_valid = isinstance(last_message, AIMessage) and last_message.content and not last_message.tool_calls
    grounded = messages_have_grounded_retrieval(
        state.get("messages", []),
        state.get("context_summary", ""),
    )
    if is_valid and grounded:
        answer = last_message.content
    elif is_valid and not grounded:
        answer = UNCERTAINTY_RESPONSE
    else:
        answer = UNCERTAINTY_RESPONSE
    return {
        "final_answer": answer,
        "agent_answers": [{"index": state["question_index"], "question": state["question"], "answer": answer}],
    }


# --- End of Agent Nodes---

def aggregate_answers(state: State, llm):
    if not state.get("agent_answers"):
        return {"messages": [AIMessage(content="I'm sorry, but I don't have enough information to answer that accurately.")]}

    sorted_answers = sorted(state["agent_answers"], key=lambda x: x["index"])

    formatted_answers = ""
    for i, ans in enumerate(sorted_answers, start=1):
        formatted_answers += f"\nAnswer {i}:\n{ans['answer']}\n"

    user_message = HumanMessage(
        content=f"Original user question: {state['originalQuery']}\nRetrieved answers:{formatted_answers}"
    )
    synthesis_response = llm.invoke([
        SystemMessage(content=get_aggregation_prompt()),
        user_message,
    ])
    return {"messages": [AIMessage(content=synthesis_response.content)]}
