import json
from typing import Any

from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from db import get_case, get_documents_for_case, save_agent_state
from graph.orchestrator import build_graph
from llm import stream_chunks

app = FastAPI(title="Saarthi Agents")
graph = build_graph()


class InvokeRequest(BaseModel):
    caseId: str
    nomineeId: str
    userMessage: str
    language: str = "en"


def _document_payload(document: dict[str, Any]) -> dict[str, Any]:
    return {
        "_id": document.get("_id"),
        "policyId": document.get("policyId"),
        "documentType": document.get("documentType"),
        "mimeType": document.get("mimeType"),
        "storagePath": document.get("storagePath"),
        "originalName": document.get("originalName"),
        "validationStatus": document.get("validationStatus"),
    }


def _build_state(req: InvokeRequest, case: dict[str, Any], documents: list[dict[str, Any]]) -> dict[str, Any]:
    saved_state = case.get("agentState", {}) or {}
    messages = list(saved_state.get("messages", []))
    messages.append({"role": "user", "content": req.userMessage})

    return {
        **saved_state,
        "case_id": req.caseId,
        "nominee_id": req.nomineeId,
        "language": req.language or case.get("language", "en"),
        "deceased_name": case.get("deceased", {}).get("name", ""),
        "deceased_aadhaar": case.get("deceased", {}).get("aadhaar"),
        "deceased_pan": case.get("deceased", {}).get("pan"),
        "deceased_employer": case.get("deceased", {}).get("employer"),
        "deceased_dod": str(case.get("deceased", {}).get("dateOfDeath", "")),
        "messages": messages,
        "latest_user_message": req.userMessage,
        "uploaded_documents": [_document_payload(document) for document in documents],
        "discovered_policies": saved_state.get("discovered_policies", []),
        "discovery_complete": saved_state.get("discovery_complete", False),
        "document_checklists": saved_state.get("document_checklists", {}),
        "document_requirements": saved_state.get("document_requirements", {}),
        "documents_validated": saved_state.get("documents_validated", {}),
        "claim_letters_generated": saved_state.get("claim_letters_generated", {}),
        "escalation_needed": saved_state.get("escalation_needed", False),
        "current_agent": saved_state.get("current_agent", "discovery"),
        "next_action": saved_state.get("next_action"),
        "ready_for_drafting": saved_state.get("ready_for_drafting", False),
        "error": None,
    }


@app.get("/health")
def health() -> dict[str, Any]:
    return {"ok": True}


@app.get("/agent/state/{case_id}")
def get_state(case_id: str) -> dict[str, Any]:
    case = get_case(case_id)
    return case.get("agentState", {}) if case else {}


@app.post("/agent/invoke")
async def invoke_agent(req: InvokeRequest):
    case = get_case(req.caseId)
    if not case:
        return StreamingResponse(iter(["data: [DONE]\n\n"]), media_type="text/event-stream")

    documents = get_documents_for_case(req.caseId)
    initial_state = _build_state(req, case, documents)

    async def event_stream():
        sent_messages = len(initial_state.get("messages", []))
        async for chunk in graph.astream(initial_state, stream_mode="values"):
            save_agent_state(req.caseId, chunk)
            messages = chunk.get("messages", [])
            new_messages = messages[sent_messages:]
            for message in new_messages:
                if message.get("role") != "assistant":
                    continue
                for piece in stream_chunks(message.get("content", "")):
                    yield "data: " + json.dumps(
                        {
                            "agent": chunk.get("current_agent"),
                            "phase": chunk.get("next_action"),
                            "contentDelta": piece,
                            "caseId": req.caseId,
                        }
                    ) + "\n\n"
            sent_messages = len(messages)

        yield "data: [DONE]\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
