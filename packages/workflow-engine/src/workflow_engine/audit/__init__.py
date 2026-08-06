"""Workflow Audit — the immutable audit record and the append-only run-ledger interface."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from platform_contracts.common import ActorRef, Id

from workflow_engine.instance import WorkflowInstance
from workflow_engine.state import WorkflowState


@dataclass(frozen=True, slots=True)
class WorkflowAuditRecord:
    """An immutable, hash-chained audit record of a workflow event (CP-7, SEC-4)."""

    instance_id: Id
    actor: ActorRef
    state: WorkflowState
    prev_hash: str
    entry_hash: str


class WorkflowAuditTrail(Protocol):
    """Append-only, tamper-evident audit trail. Interface only."""

    def append(self, record: WorkflowAuditRecord) -> None: ...


class RunLedger(Protocol):
    """Append-only run ledger recording every workflow run (WCON-3, OB-1). Interface only."""

    def record(self, instance: WorkflowInstance) -> None: ...
