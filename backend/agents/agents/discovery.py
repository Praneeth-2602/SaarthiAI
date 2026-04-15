from typing import Any

from graph.state import AgentState
from llm import generate_text
from rag.retriever import retrieve_insurer_info
from tools.bima_sugam import query_bima_sugam


def _fallback_summary(policies: list[dict[str, Any]], language: str) -> str:
    if not policies:
        return (
            "I could not find a policy in the digital records yet. "
            "Please double-check the PAN or Aadhaar details, and we can continue with direct insurer follow-up."
        )

    lines = [
        f"- {policy.get('insurerName')}: {policy.get('policyType')} policy, sum assured Rs. {policy.get('sumAssured', 'unknown')}"
        for policy in policies
    ]
    intro = {
        "hi": "मैंने उपलब्ध रिकॉर्ड्स में ये पॉलिसियां पाई हैं:",
        "te": "నాకు అందుబాటులో ఉన్న రికార్డుల్లో ఈ పాలసీలు కనిపించాయి:",
    }.get(language, "I found these policies in the available records:")
    return f"{intro}\n" + "\n".join(lines)


async def run_discovery(state: AgentState) -> dict[str, Any]:
    discovered = state.get("discovered_policies", [])

    if not discovered:
        discovered = await query_bima_sugam(
            aadhaar=state.get("deceased_aadhaar"),
            pan=state.get("deceased_pan"),
        )

    employer_context = ""
    if state.get("deceased_employer"):
        employer_context = retrieve_insurer_info(
            f"group insurance coverage for employees of {state.get('deceased_employer')}"
        )

    llm_summary = await generate_text(
        (
            "You are Saarthi, a calm and compassionate insurance claims guide. "
            "Explain discovered policies in simple language and tell the family what happens next."
        ),
        (
            f"Language: {state.get('language', 'en')}\n"
            f"Policies: {discovered}\n"
            f"Employer context: {employer_context}\n"
            "Keep the response short, warm, and action-oriented."
        ),
    )

    message = llm_summary or _fallback_summary(discovered, state.get("language", "en"))
    messages = [*state.get("messages", []), {"role": "assistant", "content": message}]

    return {
        **state,
        "messages": messages,
        "discovered_policies": discovered,
        "discovery_complete": True,
        "current_agent": "discovery",
        "next_action": "review_documents",
    }
