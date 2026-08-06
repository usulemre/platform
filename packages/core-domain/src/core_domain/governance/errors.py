"""Governance domain errors."""
from __future__ import annotations

from core_domain.shared import DomainError


class MissingCounterSignature(DomainError):
    """A capital-affecting approval lacks an independent counter-signature (HO-2)."""


class AIOverrideAttempt(DomainError):
    """An AI attempted to override a human governance decision (HO-1, AI-4)."""


class ControlBypassOverride(DomainError):
    """A human override attempted to bypass statistical/risk enforcement; it is void (HO-3)."""


class UnauthorizedApproval(DomainError):
    """An actor approved something they have no authority to approve (CP-5, HO-1)."""
