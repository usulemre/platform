"""Agent domain errors."""
from __future__ import annotations

from core_domain.shared import DomainError


class DecideAuthorityForbidden(DomainError):
    """An agent was assigned or attempted 'decide' authority (REG-9, AI-1..4)."""


class SelfEscalation(DomainError):
    """An agent attempted to change its own registry entry or increase its authority (REG-22/23)."""


class UnpinnedModel(DomainError):
    """An agent attempted to run an unpinned or 'latest' model (AI-6)."""


class UnregisteredAgent(DomainError):
    """An unregistered agent attempted to operate (REG-1)."""
