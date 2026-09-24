"""Per-user rate limiting (falls back to the client IP before authentication)."""

from __future__ import annotations

import hashlib
import os

from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address


def rate_limit_key(request: Request) -> str:
    auth = request.headers.get("authorization", "")
    if auth.lower().startswith("bearer "):
        # Hash so tokens never end up in the limiter's storage or logs.
        return "tok:" + hashlib.sha256(auth[7:].encode()).hexdigest()[:32]
    return "ip:" + get_remote_address(request)


# Applies to every route (routes add stricter limits on top).
limiter = Limiter(
    key_func=rate_limit_key,
    default_limits=[os.environ.get("RATE_LIMIT_DEFAULT", "120/minute")],
    headers_enabled=False,
)
