"""Signal domain errors."""
from __future__ import annotations

from core_domain.shared import DomainError


class GrossSelection(DomainError):
    """A signal was selected on gross (pre-cost) performance (AD-1, AP-10)."""


class GeneratorObservedValidation(DomainError):
    """A generator observed validation/OOS outcomes (AD-3, isolation barrier P2-07)."""
