"""Portfolio Metadata — the immutable, auditable metadata of a portfolio (data only)."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import Provenance

from portfolio_service.model import PortfolioIdentifier, PortfolioSummary
from portfolio_service.status import PortfolioStatus


@dataclass(frozen=True, slots=True)
class PortfolioMetadata:
    """Immutable metadata for a portfolio (auditable, provenance-bearing)."""

    identifier: PortfolioIdentifier
    description: str
    owner_role: str
    status: PortfolioStatus
    summary: PortfolioSummary
    provenance: Provenance
    tags: tuple[str, ...]
