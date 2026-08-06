"""Backtest Lifecycle — the canonical lifecycle states, transitions, and lifecycle service."""
from __future__ import annotations

from enum import Enum
from typing import Protocol

from core_domain.shared import EntityId


class BacktestLifecycle(Enum):
    """The canonical backtest lifecycle (plus SUSPENDED for resume and CANCELLED for cancellation)."""

    PROPOSED = "proposed"
    CONFIGURED = "configured"
    READY = "ready"
    RUNNING = "running"
    VALIDATING = "validating"
    COMPLETED = "completed"
    APPROVED = "approved"
    ARCHIVED = "archived"
    SUSPENDED = "suspended"
    CANCELLED = "cancelled"


L = BacktestLifecycle

#: The canonical allowed transitions (any transition not listed is forbidden, fail-closed).
CANONICAL_TRANSITIONS: tuple[tuple[BacktestLifecycle, BacktestLifecycle], ...] = (
    (L.PROPOSED, L.CONFIGURED),
    (L.CONFIGURED, L.READY),
    (L.READY, L.RUNNING),
    (L.RUNNING, L.VALIDATING),
    (L.VALIDATING, L.COMPLETED),
    (L.COMPLETED, L.APPROVED),
    (L.APPROVED, L.ARCHIVED),
    # revision (before running)
    (L.CONFIGURED, L.PROPOSED),
    (L.READY, L.CONFIGURED),
    # resume
    (L.RUNNING, L.SUSPENDED),
    (L.VALIDATING, L.SUSPENDED),
    (L.SUSPENDED, L.RUNNING),
    # revalidation (of an immutable completed result)
    (L.COMPLETED, L.VALIDATING),
    # cancellation
    (L.CONFIGURED, L.CANCELLED),
    (L.READY, L.CANCELLED),
    (L.RUNNING, L.CANCELLED),
    (L.VALIDATING, L.CANCELLED),
    (L.SUSPENDED, L.CANCELLED),
)

#: Terminal states. Replay reproduces a run from its manifest as a NEW backtest (with lineage), never
#: a mutation of a completed run (RL-1, BT-3); comparison is an operation, not a state.
TERMINAL_STATES: frozenset[BacktestLifecycle] = frozenset({L.ARCHIVED, L.CANCELLED})


class BacktestLifecycleService(Protocol):
    """Governs lifecycle transitions. VALIDATING/COMPLETED/APPROVED require the deterministic run and
    validation gates; the service performs NO adjudication. Interface only."""

    def transition(self, backtest: EntityId, to: BacktestLifecycle) -> None: ...
