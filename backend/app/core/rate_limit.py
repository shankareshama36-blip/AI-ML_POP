"""Rate limiting configuration using slowapi."""

from __future__ import annotations

from fastapi import Request
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded

from backend.app.api.auth_api import limiter

__all__ = ["limiter", "rate_limit_exceeded_handler"]


def rate_limit_exceeded_handler(
    request: Request, exc: RateLimitExceeded
) -> JSONResponse:
    """Return standard 429 JSON response on rate limit violation."""
    return JSONResponse(
        status_code=429,
        content={"detail": "Too many attempts. Try again later."},
    )
