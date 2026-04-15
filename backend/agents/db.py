import os
from datetime import datetime, timezone
from typing import Any

from bson import ObjectId
from pymongo import MongoClient


def _mongo_uri() -> str:
    return os.getenv("MONGODB_URI", "mongodb://localhost:27017/saarthi")


def _database_name() -> str:
    uri = _mongo_uri().rstrip("/")
    if "/" in uri and uri.rsplit("/", 1)[-1]:
        return uri.rsplit("/", 1)[-1].split("?")[0]
    return "saarthi"


_client = MongoClient(_mongo_uri())
_db = _client[_database_name()]


def get_case(case_id: str) -> dict[str, Any] | None:
    return _db.cases.find_one({"_id": ObjectId(case_id)})


def get_documents_for_case(case_id: str) -> list[dict[str, Any]]:
    return list(_db.documents.find({"caseId": ObjectId(case_id)}).sort("createdAt", -1))


def update_document_validation(document_id: str, status: str, note: str | None) -> None:
    _db.documents.update_one(
        {"_id": ObjectId(document_id)},
        {
            "$set": {
                "validationStatus": status,
                "validationNote": note,
                "updatedAt": datetime.now(timezone.utc),
            }
        },
    )


def _serialize(value: Any) -> Any:
    if isinstance(value, ObjectId):
        return str(value)
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, dict):
        return {key: _serialize(inner) for key, inner in value.items()}
    if isinstance(value, list):
        return [_serialize(item) for item in value]
    return value


def _phase_from_state(state: dict[str, Any]) -> str:
    if state.get("claim_letters_generated"):
        return "drafting"
    if state.get("document_checklists"):
        return "documentation"
    return "discovery"


def save_agent_state(case_id: str, state: dict[str, Any]) -> None:
    serialized = _serialize(state)
    policies = serialized.get("discovered_policies", [])
    document_requirements = serialized.get("document_requirements", {})
    documents_validated = serialized.get("documents_validated", {})
    claim_letters = serialized.get("claim_letters_generated", {})

    hydrated_policies: list[dict[str, Any]] = []
    for policy in policies:
        policy_id = policy.get("policyNumber", policy.get("insurerName", "policy"))
        hydrated_policies.append(
            {
                **policy,
                "documentsRequired": document_requirements.get(policy_id, []),
                "documentsUploaded": list(documents_validated.get(policy_id, {}).keys()),
                "claimLetterGenerated": policy_id in claim_letters,
                "claimStatus": "in_progress",
            }
        )

    _db.cases.update_one(
        {"_id": ObjectId(case_id)},
        {
            "$set": {
                "agentState": serialized,
                "policies": hydrated_policies,
                "phase": _phase_from_state(serialized),
                "updatedAt": datetime.now(timezone.utc),
            }
        },
    )
