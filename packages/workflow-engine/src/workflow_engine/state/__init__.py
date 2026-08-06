"""Workflow State — the canonical lifecycle enum and state categories (data only, no logic)."""
from __future__ import annotations

from enum import Enum


class WorkflowState(Enum):
    """The canonical workflow lifecycle (realizes the Tier-5 universal state machine).

    Forward lifecycle: PROPOSED -> REGISTERED -> READY -> RUNNING -> VALIDATING -> APPROVED ->
    COMPLETED. Failure/holding states: FAILED, REJECTED, BLOCKED, ESCALATED, SUSPENDED, RETIRED.
    """

    PROPOSED = "proposed"
    REGISTERED = "registered"
    READY = "ready"
    RUNNING = "running"
    VALIDATING = "validating"
    APPROVED = "approved"
    COMPLETED = "completed"
    # failure / holding
    FAILED = "failed"
    REJECTED = "rejected"
    BLOCKED = "blocked"
    ESCALATED = "escalated"
    SUSPENDED = "suspended"
    RETIRED = "retired"


class StateCategory(Enum):
    """Coarse classification of a state (for policy/monitoring — no behavior here)."""

    ACTIVE = "active"      # PROPOSED, REGISTERED, READY, RUNNING, VALIDATING, APPROVED
    HOLDING = "holding"    # BLOCKED, SUSPENDED, ESCALATED (recoverable)
    TERMINAL = "terminal"  # COMPLETED, REJECTED, RETIRED, FAILED


#: Terminal states — no outbound transitions except governed retirement bookkeeping.
TERMINAL_STATES: frozenset[WorkflowState] = frozenset(
    {WorkflowState.COMPLETED, WorkflowState.REJECTED, WorkflowState.RETIRED, WorkflowState.FAILED}
)

#: Failure / non-success states (WFC-19 requires defined behavior for these).
FAILURE_STATES: frozenset[WorkflowState] = frozenset(
    {
        WorkflowState.FAILED,
        WorkflowState.REJECTED,
        WorkflowState.BLOCKED,
        WorkflowState.ESCALATED,
        WorkflowState.SUSPENDED,
        WorkflowState.RETIRED,
    }
)
