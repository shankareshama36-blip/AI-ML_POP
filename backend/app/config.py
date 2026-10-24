import os

ENV = os.getenv("ENVIRONMENT", os.getenv("ENV", "development")).lower()
_jwt_secret = os.getenv("JWT_SECRET")

if not _jwt_secret:
    if ENV == "production":
        raise RuntimeError(
            "JWT_SECRET environment variable must be set in production"
        )
    _jwt_secret = "dev-only-insecure-secret-do-not-use-in-prod"

JWT_SECRET = _jwt_secret
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = 168  # 7 days

DEMO_ACCOUNTS_ENABLED = os.getenv(
    "ENABLE_DEMO_ACCOUNTS",
    "true",
).lower() in {"1", "true", "yes"}

ALLOWED_ORIGINS = [
    o.strip()
    for o in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if o.strip()
]

if "*" in ALLOWED_ORIGINS:
    raise RuntimeError("Wildcard CORS origin not allowed with credentials")
