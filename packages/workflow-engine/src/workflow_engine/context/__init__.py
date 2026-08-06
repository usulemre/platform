"""Workflow Context — the immutable execution context passed to each step (deterministic)."""
from __future__ import annotations

from dataclasses import dataclass

from platform_contracts.common import ActorRef, CorrelationId, Id


@dataclass(frozen=True, slots=True)
class WorkflowContext:
    """Immutable context for a workflow step.

    Time is not read here: ``as_of`` is a supplied ISO-8601 knowledge-time boundary for any
    point-in-time reads a step performs (PIT-1); the workflow engine itself performs no I/O.
    """

    instance_id: Id
    correlation_id: CorrelationId
    actor: ActorRef
    as_of: str | None
