"""Execution domain errors."""
from __future__ import annotations

from core_domain.shared import DomainError


class UnauthorizedExecution(DomainError):
    """Live execution attempted without a valid authorization token (RS-4, FB-12)."""


class AIExecutionAttempt(DomainError):
    """An AI attempted to execute or authorize execution (AI-1, FB-1)."""


class ParityBreach(DomainError):
    """A research-to-production parity breach blocks execution (P3-15)."""


class IrreversibleDeployment(DomainError):
    """A deployment that cannot be safely unwound (DEP-3)."""
