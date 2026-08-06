"""Workflow Integration — the API workflow-trigger INTERFACE (Workflow Contracts; orchestrate not adjudicate).

The API MUST NOT bypass Workflow Contracts. It triggers approved Tier-5 workflows for consequential
operations; it never adjudicates (WCON-2).
"""
from __future__ import annotations

from typing import Protocol

from workflow_engine.context import WorkflowContext
from workflow_engine.instance import WorkflowInstance


class ApiWorkflowTrigger(Protocol):
    """Triggers an approved Tier-5 workflow for a consequential API operation. Interface only.

    The API triggers the workflow; the workflow orchestrates and its gates delegate to deterministic
    engines/humans (WCON-2, AV2-18). The API never bypasses the staged chain.
    """

    def trigger(self, workflow_ref: str, context: WorkflowContext) -> WorkflowInstance: ...
