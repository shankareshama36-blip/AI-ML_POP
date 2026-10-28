"""Small thread-safe in-memory repositories for the V1 workflow.

This adapter intentionally keeps persistence behind an interface-like boundary
so PostgreSQL can replace it without changing HTTP or decision-engine code.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from threading import RLock
from uuid import UUID

from backend.app.models import (
    Approval,
    ApprovalStatus,
    ApprovalUpdate,
    DecisionWorkflowResponse,
    Experience,
    Outcome,
    OutcomeCreate,
)


class DecisionNotFoundError(LookupError):
    """The requested decision ID is absent from the repository."""


class DecisionLifecycleError(ValueError):
    """A decision status transition is not permitted."""


class DecisionRepository:
    """Process-local audit store for decisions and completed experiences."""

    def __init__(self) -> None:
        self._decisions: dict[UUID, DecisionWorkflowResponse] = {}
        self._experiences: list[Experience] = []
        self._lock = RLock()

    def create(self, workflow: DecisionWorkflowResponse) -> DecisionWorkflowResponse:
        with self._lock:
            self._decisions[workflow.decision.decision_id] = workflow
            return workflow.model_copy(deep=True)

    def get(
        self, decision_id: UUID, tenant_id: str | None = None
    ) -> DecisionWorkflowResponse:
        with self._lock:
            try:
                workflow = self._decisions[decision_id]
                if tenant_id and workflow.tenant_id and str(workflow.tenant_id) != str(tenant_id):
                    raise DecisionNotFoundError(
                        f"Decision {decision_id} was not found"
                    )
                return workflow.model_copy(deep=True)
            except KeyError as error:
                raise DecisionNotFoundError(
                    f"Decision {decision_id} was not found"
                ) from error

    def update_approval(
        self,
        decision_id: UUID,
        update: ApprovalUpdate,
        tenant_id: str | None = None,
        approver_email: str | None = None,
    ) -> DecisionWorkflowResponse:
        with self._lock:
            workflow = self._get_internal(decision_id)
            if tenant_id and workflow.tenant_id and str(workflow.tenant_id) != str(tenant_id):
                raise DecisionNotFoundError(
                    f"Decision {decision_id} was not found"
                )
            if (
                approver_email
                and workflow.submitted_by
                and approver_email.strip().lower() == workflow.submitted_by.strip().lower()
            ):
                raise DecisionLifecycleError("Submitter cannot approve own decision")
            if workflow.outcome is not None:
                raise DecisionLifecycleError(
                    "A completed decision cannot be re-approved"
                )
            if workflow.approval.status is not ApprovalStatus.PENDING:
                raise DecisionLifecycleError(
                    "Decision approval has already been recorded"
                )
            if update.status is ApprovalStatus.PENDING:
                raise DecisionLifecycleError("Approval must be APPROVED or REJECTED")

            approval = Approval(
                decision_id=decision_id,
                status=update.status,
                approver_id=update.approver_id,
                timestamp=update.timestamp,
            )
            updated = workflow.model_copy(update={"approval": approval}, deep=True)
            self._decisions[decision_id] = updated
            return updated.model_copy(deep=True)

    def record_outcome(
        self,
        decision_id: UUID,
        outcome_input: OutcomeCreate,
        tenant_id: str | None = None,
    ) -> DecisionWorkflowResponse:
        with self._lock:
            workflow = self._get_internal(decision_id)
            if tenant_id and workflow.tenant_id and str(workflow.tenant_id) != str(tenant_id):
                raise DecisionNotFoundError(
                    f"Decision {decision_id} was not found"
                )
            if workflow.approval.status is not ApprovalStatus.APPROVED:
                raise DecisionLifecycleError(
                    "Only an approved decision can have an execution outcome"
                )
            if workflow.outcome is not None:
                raise DecisionLifecycleError("An outcome has already been recorded")

            outcome = Outcome(decision_id=decision_id, **outcome_input.model_dump())
            updated = workflow.model_copy(update={"outcome": outcome}, deep=True)
            self._decisions[decision_id] = updated
            self._experiences.append(self._experience_from(updated, outcome))
            return updated.model_copy(deep=True)

    def list_experiences(self, tenant_id: str | None = None) -> list[Experience]:
        with self._lock:
            return [
                experience.model_copy(deep=True)
                for experience in self._experiences
                if not tenant_id or not experience.tenant_id or str(experience.tenant_id) == str(tenant_id)
            ]

    def total_decisions_count(self) -> int:
        """Count total decisions created."""
        with self._lock:
            return len(self._decisions)

    def decisions_count_this_week(self) -> int:
        """Count decisions created since the start of the current UTC week."""
        now = datetime.now(UTC)
        week_start = (now - timedelta(days=now.weekday())).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        with self._lock:
            return sum(
                workflow.timestamp >= week_start
                for workflow in self._decisions.values()
            )

    def _get_internal(self, decision_id: UUID) -> DecisionWorkflowResponse:
        try:
            return self._decisions[decision_id]
        except KeyError as error:
            raise DecisionNotFoundError(
                f"Decision {decision_id} was not found"
            ) from error

    @staticmethod
    def _experience_from(
        workflow: DecisionWorkflowResponse, outcome: Outcome
    ) -> Experience:
        decision = workflow.decision
        return Experience(
            decision_id=decision.decision_id,
            situation_summary=workflow.context.model_dump(mode="json"),
            decision_taken=decision.model_dump(mode="json"),
            prediction_accuracy={
                "downtime_delta_hours": round(
                    outcome.actual_downtime_hours - decision.expected_downtime, 2
                ),
                "cost_delta": round(outcome.actual_cost - decision.expected_cost, 2),
            },
            outcome=outcome,
            tenant_id=workflow.tenant_id,
        )
