"""State Machine — the canonical allowed transitions, gates, points, and the StateMachine interface.

This is DATA (the legal transition set) plus an INTERFACE (StateMachine). It contains no evaluation
logic; a deterministic engine in an outer layer enforces it (WCON-2, WFC-16).
"""
from __future__ import annotations

from typing import Protocol

from workflow_engine.state import TERMINAL_STATES, WorkflowState
from workflow_engine.transition import TransitionKind, WorkflowTransition

S = WorkflowState


def _t(source: S, target: S, kind: TransitionKind) -> WorkflowTransition:
    return WorkflowTransition(source=source, target=target, kind=kind)


#: The canonical, allowed transition set (the universal state machine, WFC-14/16).
CANONICAL_TRANSITIONS: tuple[WorkflowTransition, ...] = (
    # forward lifecycle
    _t(S.PROPOSED, S.REGISTERED, TransitionKind.NORMAL),
    _t(S.REGISTERED, S.READY, TransitionKind.NORMAL),
    _t(S.READY, S.RUNNING, TransitionKind.NORMAL),
    _t(S.RUNNING, S.VALIDATING, TransitionKind.VALIDATION_GATE),
    _t(S.VALIDATING, S.APPROVED, TransitionKind.APPROVAL_POINT),
    _t(S.APPROVED, S.COMPLETED, TransitionKind.NORMAL),
    # holding / resume
    _t(S.RUNNING, S.BLOCKED, TransitionKind.NORMAL),
    _t(S.BLOCKED, S.RUNNING, TransitionKind.NORMAL),
    _t(S.RUNNING, S.SUSPENDED, TransitionKind.NORMAL),
    _t(S.SUSPENDED, S.RUNNING, TransitionKind.NORMAL),
    # failure
    _t(S.RUNNING, S.FAILED, TransitionKind.NORMAL),
    _t(S.VALIDATING, S.FAILED, TransitionKind.NORMAL),
    _t(S.VALIDATING, S.REJECTED, TransitionKind.NORMAL),
    # rollback (saga compensation, WFC-19)
    _t(S.RUNNING, S.READY, TransitionKind.ROLLBACK_POINT),
    _t(S.VALIDATING, S.READY, TransitionKind.ROLLBACK_POINT),
    # escalation (WFC-41)
    _t(S.RUNNING, S.ESCALATED, TransitionKind.ESCALATION),
    _t(S.VALIDATING, S.ESCALATED, TransitionKind.ESCALATION),
    _t(S.BLOCKED, S.ESCALATED, TransitionKind.ESCALATION),
    _t(S.ESCALATED, S.RUNNING, TransitionKind.NORMAL),
    _t(S.ESCALATED, S.REJECTED, TransitionKind.NORMAL),
    # governed retirement
    _t(S.FAILED, S.RETIRED, TransitionKind.NORMAL),
    _t(S.SUSPENDED, S.RETIRED, TransitionKind.NORMAL),
)

#: Representative FORBIDDEN transitions (stage-skips / research-to-production jumps, WFC-3/17).
#: Any (source, target) not in CANONICAL_TRANSITIONS is forbidden; these are called out explicitly.
FORBIDDEN_TRANSITIONS: tuple[tuple[WorkflowState, WorkflowState], ...] = (
    (S.PROPOSED, S.COMPLETED),   # skip everything
    (S.READY, S.APPROVED),       # skip running + validating
    (S.RUNNING, S.APPROVED),     # skip validation gate
    (S.RUNNING, S.COMPLETED),    # skip validation + approval
    (S.VALIDATING, S.COMPLETED),  # skip approval
)

#: Human-approval points (require recorded human approval, HO-2).
APPROVAL_POINTS: frozenset[tuple[WorkflowState, WorkflowState]] = frozenset(
    {(S.VALIDATING, S.APPROVED)}
)

#: Deterministic validation gates (delegate to a validation engine, WCON-2).
VALIDATION_GATES: frozenset[tuple[WorkflowState, WorkflowState]] = frozenset(
    {(S.RUNNING, S.VALIDATING)}
)

#: Rollback / compensation points (WFC-19).
ROLLBACK_POINTS: frozenset[tuple[WorkflowState, WorkflowState]] = frozenset(
    {(S.RUNNING, S.READY), (S.VALIDATING, S.READY)}
)


class StateMachine(Protocol):
    """Interface over the canonical machine. A deterministic engine implements it (no logic here).

    Rejecting an undeclared transition is fail-closed (WFC-16); the platform never lets a workflow
    skip a stage or bypass a gate (WFC-3/17, AV2-18).
    """

    def is_allowed(self, source: WorkflowState, target: WorkflowState) -> bool: ...
    def is_terminal(self, state: WorkflowState) -> bool: ...
    def requires_approval(self, source: WorkflowState, target: WorkflowState) -> bool: ...
    def is_validation_gate(self, source: WorkflowState, target: WorkflowState) -> bool: ...
    def transitions_from(self, state: WorkflowState) -> tuple[WorkflowTransition, ...]: ...


__all__ = [
    "CANONICAL_TRANSITIONS", "FORBIDDEN_TRANSITIONS", "APPROVAL_POINTS", "VALIDATION_GATES",
    "ROLLBACK_POINTS", "TERMINAL_STATES", "StateMachine",
]
