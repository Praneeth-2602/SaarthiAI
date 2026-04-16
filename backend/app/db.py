from __future__ import annotations

from typing import Any

from bson import ObjectId
from pymongo import MongoClient

from .config import settings


client = MongoClient(settings.mongodb_uri)
db = client[settings.database_name]


def object_id(value: str) -> ObjectId:
    return ObjectId(value)


def now_iso() -> str:
    from datetime import datetime, timezone

    return datetime.now(timezone.utc).isoformat()


def serialize_document(document: Any) -> Any:
    if isinstance(document, list):
        return [serialize_document(item) for item in document]
    if isinstance(document, dict):
        serialized: dict[str, Any] = {}
        for key, value in document.items():
            if isinstance(value, ObjectId):
                serialized[key] = str(value)
            elif hasattr(value, "isoformat"):
                serialized[key] = value.isoformat()
            else:
                serialized[key] = serialize_document(value)
        return serialized
    return document
