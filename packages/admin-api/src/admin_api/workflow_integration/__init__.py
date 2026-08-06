"""Workflow Integration — the admin workflow-trigger INTERFACE (Workflow Contracts; orchestrate not adjudicate)."""
from __future__ import annotations

from typing import Protocol

from workflow_engine.context import WorkflowContext
from workflow_engine.instance import WorkflowInstance


class AdminWorkflowTrigger(Protocol):
    """Triggers an approved Tier-5 workflow for a consequential admin operation. Interface only.

    The Admin API triggers the workflow; the workflow orchestrates and its gates delegate to
    deterministic engines/humans (WCON-2, AV2-18). It never bypasses Workflow Contracts.
    """

    def trigger(self, workflow_ref: str, context: WorkflowContext) -> WorkflowInstance: ...
