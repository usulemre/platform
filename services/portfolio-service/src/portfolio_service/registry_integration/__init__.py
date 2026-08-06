"""Portfolio Registry Integration — the port to the Portfolio Registry (immutable snapshots; no persistence)."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from portfolio_service.model import Portfolio


class PortfolioRegistryPort(Protocol):
    """The port to the Portfolio Registry. Interface only — the concrete registry stores elsewhere.

    Every portfolio is an immutable, content-addressed snapshot with rationale (PS-4); a change creates
    a new version. Registration is append-only.
    """

    def register(self, portfolio: Portfolio) -> None: ...
    def get(self, portfolio: EntityId) -> Portfolio: ...
