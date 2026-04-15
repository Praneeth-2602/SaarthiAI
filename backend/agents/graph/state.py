from typing import Any, NotRequired, TypedDict


class AgentState(TypedDict):
    case_id: str
    nominee_id: str
    language: str
    deceased_name: str
    deceased_aadhaar: NotRequired[str | None]
    deceased_pan: NotRequired[str | None]
    deceased_employer: NotRequired[str | None]
    deceased_dod: NotRequired[str | None]
    messages: list[dict[str, Any]]
    latest_user_message: str
    uploaded_documents: list[dict[str, Any]]
    discovered_policies: list[dict[str, Any]]
    discovery_complete: bool
    document_checklists: dict[str, str]
    document_requirements: dict[str, list[str]]
    documents_validated: dict[str, dict[str, str]]
    claim_letters_generated: dict[str, dict[str, Any]]
    escalation_needed: bool
    escalation_reason: NotRequired[str | None]
    current_agent: str
    next_action: NotRequired[str | None]
    ready_for_drafting: bool
    error: NotRequired[str | None]
