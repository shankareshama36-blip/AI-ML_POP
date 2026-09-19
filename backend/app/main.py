from fastapi import FastAPI

from backend.app.formal_engine import (
    DfaValidationResult,
    MaintenanceRequest,
    validate_maintenance_request,
)

app = FastAPI(title="AM&POP API")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "am-pop-api"}


@app.post(
    "/validate/maintenance-request",
    response_model=DfaValidationResult,
)
def validate_maintenance_request_endpoint(
    payload: MaintenanceRequest,
) -> DfaValidationResult:
    """Expose the DFA validator via the FastAPI application."""

    return validate_maintenance_request(payload)
