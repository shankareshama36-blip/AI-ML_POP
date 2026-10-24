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

# Always include known production frontend origins so the app works
# regardless of what ALLOWED_ORIGINS env var is set to on the host.
_PRODUCTION_ORIGINS = [
    "https://praxis-frontend-r4tp.onrender.com",
    "https://praxis-frontend.onrender.com",
    "https://am-pop-frontend.onrender.com",
]

_env_origins = [
    o.strip()
    for o in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if o.strip()
]

# Merge env origins + production origins (deduplicated, order preserved)
ALLOWED_ORIGINS = list(dict.fromkeys(_env_origins + _PRODUCTION_ORIGINS))

if "*" in ALLOWED_ORIGINS:
    raise RuntimeError("Wildcard CORS origin not allowed with credentials")
