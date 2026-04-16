from __future__ import annotations

from pathlib import Path
from uuid import uuid4

from .config import settings


def ensure_upload_dir() -> Path:
    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    return settings.upload_dir


def store_upload(filename: str, payload: bytes) -> Path:
    upload_dir = ensure_upload_dir()
    extension = Path(filename).suffix or ".bin"
    target = upload_dir / f"{uuid4().hex}{extension}"
    target.write_bytes(payload)
    return target
