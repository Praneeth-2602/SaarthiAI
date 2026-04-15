import asyncio

from agents.discovery import run_discovery


def test_mock_discovery_returns_policies():
    result = asyncio.run(
        run_discovery(
            {
                "case_id": "case-1",
                "nominee_id": "nominee-1",
                "language": "en",
                "deceased_name": "Ramesh Kumar",
                "deceased_pan": "ABCDE1234F",
                "messages": [],
                "latest_user_message": "Please check the policies.",
                "uploaded_documents": [],
                "discovered_policies": [],
                "discovery_complete": False,
                "document_checklists": {},
                "document_requirements": {},
                "documents_validated": {},
                "claim_letters_generated": {},
                "escalation_needed": False,
                "current_agent": "discovery",
                "ready_for_drafting": False,
            }
        )
    )

    assert result["discovery_complete"] is True
    assert len(result["discovered_policies"]) >= 1
