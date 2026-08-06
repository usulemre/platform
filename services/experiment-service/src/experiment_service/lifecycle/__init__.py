"""Experiment Lifecycle — the canonical lifecycle states, transitions, and lifecycle service."""
from __future__ import annotations

from enum import Enum
from typing import Protocol

from core_domain.shared import EntityId


class ExperimentLifecycle(Enum):
    """The canonical experiment lifecycle (plus SUSPENDED and CANCELLED)."""

    PROPOSED = "proposed"
    REGISTERED = "registered"
    CONFIGURED = "configured"
    READY = "ready"
    RUNNING = "running"
    VALIDATING = "validating"
    COMPLETED = "completed"
    APPROVED = "approved"
    ARCHIVED = "archived"
    SUSPENDED = "suspended"
    CANCELLED = "cancelled"


L = ExperimentLifecycle

#: The canonical allowed transitions (any transition not listed is forbidden, fail-closed).
CANONICAL_TRANSITIONS: tuple[tuple[ExperimentLifecycle, ExperimentLifecycle], ...] = (
    (L.PROPOSED, L.REGISTERED),
    (L.REGISTERED, L.CONFIGURED),
    (L.CONFIGURED, L.READY),
    (L.READY, L.RUNNING),
    (L.RUNNING, L.VALIDATING),
    (L.VALIDATING, L.COMPLETED),
    (L.COMPLETED, L.APPROVED),
    (L.APPROVED, L.ARCHIVED),
    # revision (before running)
    (L.READY, L.CONFIGURED),
    (L.CONFIGURED, L.REGISTERED),
    # suspension / reopening
    (L.RUNNING, L.SUSPENDED),
    (L.VALIDATING, L.SUSPENDED),
    (L.SUSPENDED, L.RUNNING),
    (L.SUSPENDED, L.CANCELLED),
    # cancellation (from any pre-completion active state)
    (L.REGISTERED, L.CANCELLED),
    (L.CONFIGURED, L.CANCELLED),
    (L.READY, L.CANCELLED),
    (L.RUNNING, L.CANCELLED),
    (L.VALIDATING, L.CANCELLED),
)

#: Terminal states. Replay/branching a completed experiment creates a NEW versioned experiment
#: (with lineage), never a mutation of history (RL-1) — completed/archived are not re-run in place.
TERMINAL_STATES: frozenset[ExperimentLifecycle] = frozenset({L.ARCHIVED, L.CANCELLED})


class ExperimentLifecycleService(Protocol):
    """Governs lifecycle transitions. Transition to VALIDATING/COMPLETED/APPROVED requires the
    deterministic execution/validation gates; the service performs NO adjudication. Interface only."""

    def transition(self, experiment: EntityId, to: ExperimentLifecycle) -> None: ...
