"""Portfolio domain errors."""
from __future__ import annotations

from core_domain.shared import DomainError


class IneligibleAlpha(DomainError):
    """Construction consumed an alpha lacking a valid eligibility token (PS-1)."""


class GrossOptimization(DomainError):
    """Optimization used gross (pre-cost) returns (PS-2)."""


class ConstraintViolation(DomainError):
    """A portfolio violates a risk/optimization constraint (PS-2)."""
