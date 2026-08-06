"""Risk domain errors."""
from __future__ import annotations

from core_domain.shared import DomainError


class HardLimitBreach(DomainError):
    """A hard risk limit was breached without a halt (RS-1)."""


class AIHaltAttempt(DomainError):
    """An AI attempted to decide a risk halt/kill-switch (AI-1, RS-1)."""


class RiskIndependenceViolation(DomainError):
    """Risk oversight was not independent of research/portfolio (RS-2, CP-5)."""
