"""Workflow Instance — an immutable snapshot of a running workflow (append-only history)."""
from __future__ import annotations

from dataclasses import dataclass

from platform_contracts.common import Id, VersionTag

from workflow_engine.state import WorkflowState


@dataclass(frozen=True, slots=True)
class WorkflowInstance:
    """An immutable snapshot of a workflow instance at one point in its life.

    A transition produces a NEW snapshot; the run history is append-only (CP-2, WCON-1). Ownership
    is always explicit — an ownerless running instance is PROHIBITED (WFC-8).
    """

    instance_id: Id
    definition_id: VersionTag
    state: WorkflowState
    owner: str
