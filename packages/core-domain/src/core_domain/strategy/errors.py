"""Strategy domain errors."""
from __future__ import annotations

from core_domain.shared import DomainError


class NotCapitalEligible(DomainError):
    """A strategy lacks a valid capital-eligibility token (RG-1, FB-12)."""


class MissingReplication(DomainError):
    """A strategy reached capital without independent replication (VS-4, P2-08)."""
