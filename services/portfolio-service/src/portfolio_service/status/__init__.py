"""Portfolio Status — the current lifecycle status value object (data only)."""
from __future__ import annotations

from dataclasses import dataclass

from portfolio_service.lifecycle import PortfolioLifecycle


@dataclass(frozen=True, slots=True)
class PortfolioStatus:
    """The current lifecycle status (``since`` is a supplied ISO-8601 time, CS-3)."""

    state: PortfolioLifecycle
    since: str
