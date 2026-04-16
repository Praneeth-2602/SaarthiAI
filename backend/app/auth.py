from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Annotated

import jwt
from fastapi import Depends, Header, HTTPException, status

from .config import settings


def create_access_token(nominee_id: str, phone: str) -> str:
    payload = {
        "sub": nominee_id,
        "phone": phone,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def decode_access_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token.") from exc


def _extract_bearer_token(authorization: str | None) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization required.")
    return authorization.replace("Bearer ", "", 1)


def get_current_user(authorization: Annotated[str | None, Header()] = None) -> dict:
    token = _extract_bearer_token(authorization)
    return decode_access_token(token)
