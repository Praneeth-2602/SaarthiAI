import base64
import os
from pathlib import Path
from typing import Any


async def validate_document_image(document: dict[str, Any]) -> tuple[str, str | None]:
    gemini_key = os.getenv("GEMINI_API_KEY")
    file_path = document.get("storagePath")
    mime_type = document.get("mimeType", "")

    if not file_path or not Path(file_path).exists():
        return "pending_manual_review", "Uploaded file could not be found for automated review."

    if not gemini_key or not mime_type.startswith("image/"):
        if mime_type == "application/pdf":
            return "valid", "PDF uploaded successfully. Manual preview is recommended before submission."
        return "pending_manual_review", "Automated vision review is unavailable, so Saarthi marked this for manual review."

    try:
        from langchain_google_genai import ChatGoogleGenerativeAI

        image_bytes = Path(file_path).read_bytes()
        payload = [
            {
                "type": "text",
                "text": (
                    "You are validating an insurance claim document photo. "
                    "Reply as JSON with keys status and note. "
                    "Valid statuses: valid, blurry, incomplete, wrong_document."
                ),
            },
            {
                "type": "image_url",
                "image_url": {
                    "url": f"data:{mime_type};base64,{base64.b64encode(image_bytes).decode('utf-8')}"
                },
            },
        ]

        client = ChatGoogleGenerativeAI(
            google_api_key=gemini_key,
            model="gemini-1.5-flash",
            temperature=0,
        )
        response = await client.ainvoke(payload)
        content = getattr(response, "content", "")

        lowered = content.lower()
        for status in ("valid", "blurry", "incomplete", "wrong_document"):
            if status in lowered:
                return status, content
    except Exception:
        return "pending_manual_review", "Vision validation failed, so Saarthi marked this for manual review."

    return "pending_manual_review", "Vision validation was inconclusive, so Saarthi marked this for manual review."
