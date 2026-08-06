"""Portfolio domain events."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import DomainEvent, EntityId


@dataclass(frozen=True, slots=True)
class PortfolioConstructed(DomainEvent):
    """A portfolio snapshot was constructed from capital-eligible alphas (canonical event)."""

    portfolio_id: EntityId
