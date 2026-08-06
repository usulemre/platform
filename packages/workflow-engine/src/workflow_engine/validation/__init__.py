"""Workflow Validation — the validation-gate interface (delegates, never adjudicates)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from workflow_engine.context import WorkflowContext


@dataclass(frozen=True, slots=True)
class WorkflowValidation:
    """An immutable record of a validation-gate outcome (the deterministic engine produced it)."""

    gate: str
    passed: bool


class WorkflowValidationGate(Protocol):
    """A validation gate that DELEGATES to a deterministic engine (WCON-2, AV2-18).

    The workflow never computes significance/validity itself; it invokes the owning engine and
    routes on the result. Interface only.
    """

    def evaluate(self, context: WorkflowContext) -> WorkflowValidation: ...
