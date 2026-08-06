"""Workflow Escalation — the escalation interface and path (halts on integrity/isolation/security)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from workflow_engine.context import WorkflowContext


@dataclass(frozen=True, slots=True)
class EscalationPath:
    """The defined escalation target and whether it halts progression (WFC-41)."""

    to_role: str
    halts: bool  # integrity/isolation/security escalations MUST halt and reach GRC (WFC-41)


class WorkflowEscalation(Protocol):
    """Escalates a workflow along its defined path; halts the affected progression. Interface only."""

    def escalate(self, context: WorkflowContext, path: EscalationPath, reason: str) -> None: ...
