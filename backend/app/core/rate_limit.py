"""Rate limiting configuration using slowapi."""

from __future__ import annotations

from fastapi import Request
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])


def rate_limit_exceeded_handler(
    request: Request, exc: RateLimitExceeded
) -> JSONResponse:
    """Return standard 429 JSON response on rate limit violation."""
    return JSONResponse(
        status_code=429,
        content={"detail": "Rate limit exceeded"},
    )
