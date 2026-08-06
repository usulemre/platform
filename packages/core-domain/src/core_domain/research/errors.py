"""Research domain errors."""
from __future__ import annotations

from core_domain.shared import DomainError


class PreRegistrationLocked(DomainError):
    """Attempt to alter success criteria after pre-registration (p-hacking, FB-8)."""


class HypothesisNotFalsifiable(DomainError):
    """A hypothesis lacks a falsifiable prediction (SM-1)."""
