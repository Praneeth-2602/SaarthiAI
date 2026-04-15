from datetime import date
from typing import Any

from graph.state import AgentState
from llm import generate_text
from rag.retriever import retrieve_insurer_info


def _fallback_letter(policy: dict[str, Any], state: AgentState) -> str:
    return (
        f"Date: {date.today().strftime('%d %B %Y')}\n\n"
        f"To,\nClaims Manager\n{policy.get('insurerName')}\n[BRANCH ADDRESS]\n\n"
        f"Subject: Death claim request for policy {policy.get('policyNumber')}\n\n"
        f"Dear Sir/Madam,\n\n"
        f"I am writing to submit a death claim for policy number {policy.get('policyNumber')} "
        f"held by {state.get('deceased_name')}, who passed away on {state.get('deceased_dod', '[date of death]')}.\n\n"
        "I am the nominee under the policy and have attached the required supporting documents for your review. "
        "Kindly process the claim and let me know if any further clarification is required.\n\n"
        "Sincerely,\n[Nominee Name]\n[Contact Number]"
    )


async def run_drafting_agent(state: AgentState) -> dict[str, Any]:
    generated_letters: dict[str, dict[str, Any]] = {}
    policies = state.get("discovered_policies", [])

    for policy in policies:
        identifier = policy.get("policyNumber", policy.get("insurerName", "policy"))
        format_context = retrieve_insurer_info(
            f"{policy.get('insurerName')} death claim letter format nominee"
        )

        llm_letter = await generate_text(
            (
                "You draft formal but readable insurance death claim letters. "
                "Use the insurer context when available and keep placeholders where personal details are still missing."
            ),
            (
                f"Insurer context: {format_context}\n"
                f"Policy: {policy}\n"
                f"Deceased: {state.get('deceased_name')}\n"
                f"Date of death: {state.get('deceased_dod')}\n"
                f"Today: {date.today().isoformat()}\n"
                "Write the letter in English."
            ),
        )

        generated_letters[identifier] = {
            "insurer": policy.get("insurerName"),
            "policy_number": policy.get("policyNumber"),
            "generated_at": date.today().isoformat(),
            "letter": llm_letter or _fallback_letter(policy, state),
        }

    message = (
        "I have prepared draft claim letters for the policies that are ready. "
        "Please review the placeholders, sign the final version, and submit it with the validated documents."
    )
    messages = [*state.get("messages", []), {"role": "assistant", "content": message}]

    return {
        **state,
        "messages": messages,
        "claim_letters_generated": generated_letters,
        "current_agent": "drafting",
        "next_action": "review_and_submit",
        "ready_for_drafting": True,
    }
