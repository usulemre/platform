"""Workflow domain errors."""
from __future__ import annotations

from core_domain.shared import DomainError


class UndeclaredTransition(DomainError):
    """An out-of-band state change not in the workflow's declared transitions (WFC-16)."""


class StageSkipped(DomainError):
    """A stage was skipped (e.g., research moved directly to production) (WFC-3)."""


class GateBypassed(DomainError):
    """A transition bypassed its mandatory validation/approval gate (AV2-18)."""


class InconsistentState(DomainError):
    """A failed multi-step transition left inconsistent state (WFC-19, RE-1)."""
