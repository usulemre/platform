"""Execution Lifecycle — the canonical lifecycle states, transitions, and lifecycle service."""
from __future__ import annotations

from enum import Enum
from typing import Protocol

from core_domain.shared import EntityId


class ExecutionLifecycle(Enum):
    """The canonical execution lifecycle (plus REJECTED and CANCELLED)."""

    REQUESTED = "requested"
    PLANNED = "planned"
    VALIDATING = "validating"
    AUTHORIZED = "authorized"
    READY = "ready"
    COMPLETED = "completed"
    ARCHIVED = "archived"
    REJECTED = "rejected"
    CANCELLED = "cancelled"


L = ExecutionLifecycle

#: The canonical allowed transitions (any transition not listed is forbidden, fail-closed).
CANONICAL_TRANSITIONS: tuple[tuple[ExecutionLifecycle, ExecutionLifecycle], ...] = (
    (L.REQUESTED, L.PLANNED),
    (L.PLANNED, L.VALIDATING),
    (L.VALIDATING, L.AUTHORIZED),
    (L.AUTHORIZED, L.READY),
    (L.READY, L.COMPLETED),
    (L.COMPLETED, L.ARCHIVED),
    # reauthorization (token expiry / re-check) and rescheduling
    (L.AUTHORIZED, L.VALIDATING),
    (L.READY, L.PLANNED),
    # rejection
    (L.VALIDATING, L.REJECTED),
    # cancellation (from any pre-completion state) and recovery
    (L.PLANNED, L.CANCELLED),
    (L.VALIDATING, L.CANCELLED),
    (L.AUTHORIZED, L.CANCELLED),
    (L.READY, L.CANCELLED),
    (L.CANCELLED, L.PLANNED),   # recovery: re-plan a cancelled execution
    # archival of terminal-negative states
    (L.REJECTED, L.ARCHIVED),
    (L.CANCELLED, L.ARCHIVED),
)

#: Terminal state. Replay reproduces an execution PLAN from its manifest as a NEW execution (with
#: lineage), never a mutation (RL-1, CP-2).
TERMINAL_STATES: frozenset[ExecutionLifecycle] = frozenset({L.ARCHIVED})


class ExecutionLifecycleService(Protocol):
    """Governs lifecycle transitions. AUTHORIZED requires a valid governance token + risk sign-off +
    parity clearance; the service performs NO adjudication and no AI authorizes (RS-4, AI-1). Interface only."""

    def transition(self, execution: EntityId, to: ExecutionLifecycle) -> None: ...
