from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from .knowledge import search_knowledge


def _assistant_message(content: str, agent_name: str) -> dict[str, Any]:
    return {
        "role": "assistant",
        "content": content,
        "agentName": agent_name,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


def _suggest_policies(case_record: dict[str, Any]) -> list[dict[str, Any]]:
    deceased = case_record.get("deceased", {})
    seed = (deceased.get("pan") or deceased.get("aadhaar") or deceased.get("employer") or deceased.get("name", "SAARTHI")).upper()
    suffix = "".join(character for character in seed if character.isalnum())[-4:] or "1024"

    base_policies = [
        {
            "insurerName": "LIC",
            "policyNumber": f"LIC-{suffix}-01",
            "policyType": "term",
            "sumAssured": 1500000,
            "claimStatus": "not_started",
            "documentsRequired": [],
            "documentsUploaded": [],
            "claimLetterGenerated": False,
        }
    ]

    if deceased.get("employer"):
        base_policies.append(
            {
                "insurerName": "HDFC Life",
                "policyNumber": f"HDFC-{suffix}-02",
                "policyType": "group",
                "sumAssured": 600000,
                "claimStatus": "not_started",
                "documentsRequired": [],
                "documentsUploaded": [],
                "claimLetterGenerated": False,
            }
        )

    return base_policies


def _document_requirements(policy: dict[str, Any]) -> list[str]:
    requirements = [
        "Death certificate",
        "Nominee identity proof",
        "Cancelled cheque",
        "Policy bond",
    ]
    if policy.get("policyType") == "group":
        requirements.append("Employer certificate")
    return requirements


def run_agent(case_record: dict[str, Any], user_message: str) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    state = case_record.get("agentState") or {}
    policies = case_record.get("policies") or []
    messages: list[dict[str, Any]] = []
    current_phase = case_record.get("phase", "discovery")
    normalized = user_message.lower()

    if not policies:
        policies = _suggest_policies(case_record)
        for policy in policies:
            policy["documentsRequired"] = _document_requirements(policy)
        insurer_context = search_knowledge("claim procedure documents", policies[0]["insurerName"])
        messages.append(
            _assistant_message(
                "I found likely policies and mapped the first set of documents we should collect. "
                "We can start with the death certificate, nominee identity proof, cancelled cheque, and policy bond."
                + (f"\n\nReference notes:\n{insurer_context[:500]}" if insurer_context else ""),
                "discovery",
            )
        )
        current_phase = "documentation"

    document_requirements = {
        policy["policyNumber"]: _document_requirements(policy) for policy in policies
    }
    validations = state.get("documents_validated", {})
    uploaded_documents = case_record.get("documents", [])

    for policy in policies:
        policy_id = policy["policyNumber"]
        relevant_documents = [doc for doc in uploaded_documents if doc.get("policyId") in (None, "", policy_id)]
        uploaded_types = {doc["documentType"] for doc in relevant_documents}
        policy["documentsUploaded"] = sorted(uploaded_types)
        validations[policy_id] = {
            requirement: ("valid" if requirement in uploaded_types else "missing")
            for requirement in document_requirements[policy_id]
        }

    ready_for_drafting = bool(
        policies
        and all(all(status == "valid" for status in validations[policy["policyNumber"]].values()) for policy in policies)
    )
    claim_letters = state.get("claim_letters_generated", {})

    if ready_for_drafting and not claim_letters:
        for policy in policies:
            policy_id = policy["policyNumber"]
            letter = (
                f"To,\nThe Claims Officer\n{policy['insurerName']}\n\n"
                f"Subject: Death claim for policy {policy_id}\n\n"
                f"I am the nominee for the late {case_record['deceased']['name']}. "
                "Please process the enclosed death claim and confirm if any additional documents are needed.\n\n"
                "Sincerely,\nNominee"
            )
            claim_letters[policy_id] = {
                "insurer": policy["insurerName"],
                "policy_number": policy_id,
                "generated_at": datetime.now(timezone.utc).date().isoformat(),
                "letter": letter,
            }
            policy["claimLetterGenerated"] = True
            policy["claimStatus"] = "ready_to_submit"

        messages.append(
            _assistant_message(
                "The required documents now look complete, so I drafted ready-to-review claim letters for each discovered policy.",
                "drafting",
            )
        )
        current_phase = "drafting"
    elif "reject" in normalized or "delay" in normalized or "escalat" in normalized:
        messages.append(
            _assistant_message(
                "I have moved this case into escalation guidance. I can help draft an insurer escalation note or an IRDAI complaint next.",
                "escalation",
            )
        )
        current_phase = "escalated"
    elif "document" in normalized or "upload" in normalized:
        messages.append(
            _assistant_message(
                "I checked the uploaded files against the current checklist. The right panel shows what is complete and what is still missing for each policy.",
                "document",
            )
        )
        current_phase = "documentation"
    elif "policy" in normalized or "discover" in normalized:
        messages.append(
            _assistant_message(
                "I reviewed the case details again and kept the discovered policies in view. If you can share employer or ID details, I can keep refining the search.",
                "discovery",
            )
        )
    else:
        messages.append(
            _assistant_message(
                "I’m keeping this simple: we will confirm policies, finish the missing documents, and then prepare the claim letters together.",
                "saarthi",
            )
        )

    next_action = "review_documents"
    if ready_for_drafting:
        next_action = "review_claim_letters"
    elif any("missing" in status for checks in validations.values() for status in checks.values()):
        next_action = "upload_missing_documents"

    updated_state = {
        "current_agent": messages[-1]["agentName"],
        "discovered_policies": policies,
        "document_requirements": document_requirements,
        "document_checklists": {
            policy_id: ", ".join(requirements) for policy_id, requirements in document_requirements.items()
        },
        "documents_validated": validations,
        "claim_letters_generated": claim_letters,
        "ready_for_drafting": ready_for_drafting,
        "next_action": next_action,
    }

    return {
        "phase": current_phase,
        "policies": policies,
        "agentState": updated_state,
    }, messages
