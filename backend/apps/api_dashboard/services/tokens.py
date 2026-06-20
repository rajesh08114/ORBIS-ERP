from __future__ import annotations

import base64
import json
from datetime import datetime, timezone
from typing import Any


def decode_unverified_jwt(token: str) -> dict[str, Any]:
    try:
        header_b64, payload_b64, *_ = token.split(".")
        payload = _urlsafe_b64decode(payload_b64)
        data = json.loads(payload.decode("utf-8"))
        data["_header"] = json.loads(_urlsafe_b64decode(header_b64).decode("utf-8"))
        return data
    except Exception as exc:
        raise ValueError("Invalid JWT token") from exc


def token_expiration_summary(token: str) -> dict[str, Any]:
    payload = decode_unverified_jwt(token)
    exp = payload.get("exp")
    exp_dt = datetime.fromtimestamp(exp, tz=timezone.utc) if exp else None
    now = datetime.now(timezone.utc)
    return {
        "payload": payload,
        "expires_at": exp_dt.isoformat() if exp_dt else None,
        "is_expired": bool(exp_dt and exp_dt <= now),
        "seconds_to_expiry": int((exp_dt - now).total_seconds()) if exp_dt else None,
    }


def _urlsafe_b64decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(value + padding)
