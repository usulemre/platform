"""Portfolio event contracts."""
from __future__ import annotations

from dataclasses import dataclass

from platform_contracts.common import Event, Id


@dataclass(frozen=True, slots=True)
class PortfolioConstructed(Event):
    """Canonical event: an immutable portfolio snapshot was constructed (net-of-cost, PS-4)."""

    portfolio_id: Id
