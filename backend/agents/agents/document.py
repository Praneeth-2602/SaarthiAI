from typing import Any

from db import update_document_validation
from graph.state import AgentState
from llm import generate_text
from rag.retriever import retrieve_required_documents
from tools.vision import validate_document_image


def _policy_id(policy: dict[str, Any]) -> str:
    return policy.get("policyNumber", policy.get("insurerName", "policy"))


def _build_checklist(requirements: list[str]) -> str:
    return "\n".join(f"{index + 1}. {item}" for index, item in enumerate(requirements))


def _fallback_document_message(
    policies: list[dict[str, Any]],
    checklists: dict[str, str],
    validations: dict[str, dict[str, str]],
) -> str:
    if not policies:
        return "Once we identify a policy, I will prepare the exact document checklist for you."

    parts = ["I have prepared the document checklist for each discovered policy."]
    for policy in policies:
        identifier = _policy_id(policy)
        insurer = policy.get("insurerName", "insurer")
        parts.append(f"\n{insurer} ({identifier})\n{checklists.get(identifier, '')}")
        policy_validations = validations.get(identifier, {})
        if policy_validations:
            parts.append(f"Validation status: {policy_validations}")
    parts.append("\nUpload the required documents and I will validate them for claim readiness.")
    return "\n".join(parts)


async def run_document_agent(state: AgentState) -> dict[str, Any]:
    policies = state.get("discovered_policies", [])
    uploaded_documents = state.get("uploaded_documents", [])

    document_requirements: dict[str, list[str]] = {}
    document_checklists: dict[str, str] = {}
    documents_validated = state.get("documents_validated", {}).copy()

    for policy in policies:
        identifier = _policy_id(policy)
        requirements, context = retrieve_required_documents(
            policy.get("insurerName", ""),
            policy.get("policyType", "life"),
        )
        document_requirements[identifier] = requirements

        checklist_text = await generate_text(
            (
                "You are Saarthi. Turn insurer claim requirements into a plain-language checklist "
                "for a nominee who may be unfamiliar with insurance jargon."
            ),
            (
                f"Language: {state.get('language', 'en')}\n"
                f"Insurer: {policy.get('insurerName')}\n"
                f"Requirements: {requirements}\n"
                f"Source context: {context}\n"
                "Include what each document is and a short hint for where to get it."
            ),
        )

        document_checklists[identifier] = checklist_text or _build_checklist(requirements)

    for document in uploaded_documents:
        identifier = document.get("policyId") or (policies[0].get("policyNumber") if policies else "general")
        status, note = await validate_document_image(document)
        documents_validated.setdefault(identifier, {})
        documents_validated[identifier][document.get("documentType", "document")] = status

        if document.get("_id"):
            update_document_validation(str(document["_id"]), status, note)

    ready_for_drafting = True if policies else False
    for policy in policies:
        identifier = _policy_id(policy)
        required = document_requirements.get(identifier, [])
        uploaded = documents_validated.get(identifier, {})
        if not required:
            continue
        if any(uploaded.get(requirement) != "valid" for requirement in required):
            ready_for_drafting = False

    llm_message = await generate_text(
        (
            "You are Saarthi. Summarize the document checklist and validation results. "
            "Be specific about what still needs to be uploaded."
        ),
        (
            f"Language: {state.get('language', 'en')}\n"
            f"Checklists: {document_checklists}\n"
            f"Validation results: {documents_validated}\n"
            f"Ready for drafting: {ready_for_drafting}"
        ),
    )

    message = llm_message or _fallback_document_message(
        policies, document_checklists, documents_validated
    )
    messages = [*state.get("messages", []), {"role": "assistant", "content": message}]

    return {
        **state,
        "messages": messages,
        "document_requirements": document_requirements,
        "document_checklists": document_checklists,
        "documents_validated": documents_validated,
        "current_agent": "document",
        "ready_for_drafting": ready_for_drafting,
        "next_action": "draft_claims" if ready_for_drafting else "await_documents",
    }
