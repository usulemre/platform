"""Strategy repository and lifecycle-service interfaces (no implementations)."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from .model import Strategy


class StrategyRepository(Protocol):
    """Append-only repository of strategy versions (immutable)."""

    def get(self, id: EntityId) -> Strategy: ...
    def add(self, strategy: Strategy) -> None: ...


class StrategyLifecycleService(Protocol):
    """Interface: governs lifecycle transitions incl. retirement. No adjudication here."""

    def retire(self, strategy: EntityId) -> None: ...
