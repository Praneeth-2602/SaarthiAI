from __future__ import annotations

import json
import random
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel

from .agents.orchestrator import run_agent
from .auth import create_access_token, get_current_user
from .config import settings
from .db import db, now_iso, object_id, serialize_document
from .storage import store_upload


app = FastAPI(title=settings.app_name)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

otp_store: dict[str, dict[str, Any]] = {}


class OtpRequest(BaseModel):
    phone: str


class VerifyOtpRequest(BaseModel):
    phone: str
    otp: str
    name: str | None = None


class CaseCreateRequest(BaseModel):
    language: str = "en"
    deceased: dict[str, str | None]


class AgentInvokeRequest(BaseModel):
    caseId: str
    userMessage: str
    language: str = "en"


def _require_case(case_id: str, nominee_id: str) -> dict[str, Any]:
    case_record = db.cases.find_one({"_id": object_id(case_id), "nomineeId": nominee_id})
    if not case_record:
        raise HTTPException(status_code=404, detail="Case not found.")
    return serialize_document(case_record)


def _case_with_documents(case_record: dict[str, Any]) -> dict[str, Any]:
    documents = list(
        db.documents.find({"caseId": case_record["_id"], "nomineeId": case_record["nomineeId"]}).sort("createdAt", -1)
    )
    serialized_case = serialize_document(case_record)
    serialized_case["documents"] = serialize_document(documents)
    return serialized_case


def _conversation_message(role: str, content: str, language: str, agent_name: str | None = None) -> dict[str, Any]:
    payload = {
        "role": role,
        "content": content,
        "language": language,
        "timestamp": now_iso(),
    }
    if agent_name:
        payload["agentName"] = agent_name
    return payload


@app.get("/health")
def health() -> dict[str, bool]:
    return {"ok": True}


@app.post("/api/auth/request-otp")
def request_otp(payload: OtpRequest) -> dict[str, Any]:
    phone = payload.phone.strip()
    if len(phone) < 10:
        raise HTTPException(status_code=400, detail="Please enter a valid phone number.")

    code = "".join(str(random.randint(0, 9)) for _ in range(6))
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=settings.otp_ttl_seconds)
    otp_store[phone] = {"otp": code, "expiresAt": expires_at}
    masked = f"{phone[:2]}******{phone[-2:]}" if len(phone) >= 4 else phone
    return {
        "maskedPhone": masked,
        "expiresAt": expires_at.isoformat(),
        "debugOtp": code if settings.environment != "production" else None,
    }


@app.post("/api/auth/verify-otp")
def verify_otp(payload: VerifyOtpRequest) -> dict[str, Any]:
    entry = otp_store.get(payload.phone.strip())
    if not entry or entry["otp"] != payload.otp.strip():
        raise HTTPException(status_code=400, detail="The OTP is invalid.")
    if entry["expiresAt"] < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="The OTP has expired.")

    phone = payload.phone.strip()
    nominee = db.nominees.find_one({"phone": phone})
    if nominee:
        if payload.name and not nominee.get("name"):
            db.nominees.update_one({"_id": nominee["_id"]}, {"$set": {"name": payload.name, "updatedAt": now_iso()}})
            nominee["name"] = payload.name
    else:
        inserted = {
            "phone": phone,
            "name": payload.name,
            "createdAt": now_iso(),
            "updatedAt": now_iso(),
        }
        nominee_id = db.nominees.insert_one(inserted).inserted_id
        nominee = {"_id": nominee_id, **inserted}

    token = create_access_token(str(nominee["_id"]), phone)
    return {
        "token": token,
        "nominee": {
            "id": str(nominee["_id"]),
            "phone": nominee["phone"],
            "name": nominee.get("name"),
        },
    }


@app.get("/api/cases")
def list_cases(user: dict = Depends(get_current_user)) -> dict[str, Any]:
    items = list(db.cases.find({"nomineeId": user["sub"]}).sort("updatedAt", -1))
    return {"items": serialize_document(items)}


@app.post("/api/cases")
def create_case(payload: CaseCreateRequest, user: dict = Depends(get_current_user)) -> dict[str, Any]:
    deceased_name = (payload.deceased.get("name") or "").strip()
    if not deceased_name:
        raise HTTPException(status_code=400, detail="Deceased name is required.")

    case_record = {
        "nomineeId": user["sub"],
        "language": payload.language,
        "phase": "discovery",
        "deceased": payload.deceased,
        "policies": [],
        "agentState": {},
        "conversationHistory": [
            _conversation_message(
                "assistant",
                "I am here to help your family move through policy discovery, documents, and claim letters one step at a time.",
                payload.language,
                "saarthi",
            )
        ],
        "createdAt": now_iso(),
        "updatedAt": now_iso(),
    }
    inserted_id = db.cases.insert_one(case_record).inserted_id
    created_case = db.cases.find_one({"_id": inserted_id})
    return serialize_document(created_case)


@app.get("/api/cases/{case_id}")
def get_case(case_id: str, user: dict = Depends(get_current_user)) -> dict[str, Any]:
    case_record = _require_case(case_id, user["sub"])
    documents = list(db.documents.find({"caseId": case_id, "nomineeId": user["sub"]}).sort("createdAt", -1))
    case_record["documents"] = serialize_document(documents)
    return case_record


@app.get("/api/documents")
def list_documents(caseId: str, user: dict = Depends(get_current_user)) -> dict[str, Any]:
    items = list(db.documents.find({"caseId": caseId, "nomineeId": user["sub"]}).sort("createdAt", -1))
    return {"items": serialize_document(items)}


@app.post("/api/documents/upload")
async def upload_document(
    caseId: str = Form(...),
    documentType: str = Form(...),
    policyId: str | None = Form(None),
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user),
) -> dict[str, Any]:
    case_record = _require_case(caseId, user["sub"])
    payload = await file.read()
    stored_path = store_upload(file.filename, payload)

    document = {
        "caseId": caseId,
        "nomineeId": user["sub"],
        "policyId": policyId,
        "documentType": documentType,
        "originalName": file.filename,
        "storagePath": str(stored_path),
        "mimeType": file.content_type or "application/octet-stream",
        "size": len(payload),
        "validationStatus": "uploaded",
        "createdAt": now_iso(),
        "updatedAt": now_iso(),
    }
    inserted_id = db.documents.insert_one(document).inserted_id

    db.cases.update_one(
        {"_id": object_id(case_record["_id"])},
        {"$set": {"updatedAt": now_iso()}},
    )
    created = db.documents.find_one({"_id": inserted_id})
    return serialize_document(created)


@app.get("/api/documents/{document_id}/download")
def download_document(document_id: str, user: dict = Depends(get_current_user)) -> FileResponse:
    document = db.documents.find_one({"_id": object_id(document_id), "nomineeId": user["sub"]})
    if not document:
        raise HTTPException(status_code=404, detail="Document not found.")
    path = Path(document["storagePath"])
    return FileResponse(path, media_type=document["mimeType"], filename=document["originalName"])


@app.get("/api/agents/state/{case_id}")
def agent_state(case_id: str, user: dict = Depends(get_current_user)) -> dict[str, Any]:
    case_record = _require_case(case_id, user["sub"])
    return case_record.get("agentState", {})


@app.post("/api/agents/invoke")
def invoke_agent(payload: AgentInvokeRequest, user: dict = Depends(get_current_user)):
    case_record = _require_case(payload.caseId, user["sub"])
    case_record = _case_with_documents(case_record)

    updated_fields, assistant_messages = run_agent(case_record, payload.userMessage)
    conversation = list(case_record.get("conversationHistory", []))
    conversation.append(_conversation_message("user", payload.userMessage, payload.language))
    conversation.extend(
        _conversation_message(
            "assistant", message["content"], payload.language, message.get("agentName")
        )
        for message in assistant_messages
    )

    db.cases.update_one(
        {"_id": object_id(payload.caseId), "nomineeId": user["sub"]},
        {
            "$set": {
                **updated_fields,
                "conversationHistory": conversation,
                "updatedAt": now_iso(),
            }
        },
    )

    async def event_stream():
        for message in assistant_messages:
            content = message["content"]
            step = max(1, len(content) // 12)
            for index in range(0, len(content), step):
                yield "data: " + json.dumps(
                    {
                        "agent": message.get("agentName", "saarthi"),
                        "contentDelta": content[index : index + step],
                        "caseId": payload.caseId,
                    }
                ) + "\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
