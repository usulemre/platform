"""Backtest Metadata — the immutable, auditable metadata of a backtest (data only)."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import Provenance

from backtesting_service.model import BacktestIdentifier
from backtesting_service.status import BacktestStatus


@dataclass(frozen=True, slots=True)
class BacktestMetadata:
    """Immutable metadata for a backtest (auditable, provenance-bearing)."""

    identifier: BacktestIdentifier
    description: str
    owner_role: str
    status: BacktestStatus
    provenance: Provenance
    tags: tuple[str, ...]
