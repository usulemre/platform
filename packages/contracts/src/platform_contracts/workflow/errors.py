"""Workflow error contracts."""
from __future__ import annotations

from enum import Enum


class WorkflowErrorCode(Enum):
    UNDECLARED_TRANSITION = "workflow.undeclared_transition"  # WFC-16
    STAGE_SKIPPED = "workflow.stage_skipped"                  # WFC-3
    GATE_BYPASSED = "workflow.gate_bypassed"                  # AV2-18
    INCONSISTENT_STATE = "workflow.inconsistent_state"        # WFC-19, RE-1
