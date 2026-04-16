from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[2]


@dataclass(frozen=True)
class Settings:
    app_name: str = "Saarthi API"
    environment: str = os.getenv("NODE_ENV", "development")
    port: int = int(os.getenv("PORT", "4000"))
    frontend_url: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    mongodb_uri: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017/saarthi")
    database_name: str = os.getenv("MONGODB_DB", "saarthi")
    jwt_secret: str = os.getenv("JWT_SECRET", "replace-with-a-long-secret")
    otp_ttl_seconds: int = int(os.getenv("OTP_TTL_SECONDS", "300"))
    upload_dir: Path = ROOT_DIR / os.getenv("UPLOAD_DIR", "storage/uploads")
    knowledge_dir: Path = ROOT_DIR / "knowledge"


settings = Settings()
