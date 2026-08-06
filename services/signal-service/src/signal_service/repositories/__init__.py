"""Signal Repository Interfaces — append-only, immutable repositories (no persistence)."""
from __future__ import annotations

from typing import Protocol

from core_domain.shared import EntityId

from signal_service.dependencies import SignalDependency
from signal_service.model import Signal
from signal_service.scoring import SignalScore


class SignalRepositoryContract(Protocol):
    """Append-only repository of signals (immutable; supersede, never mutate, CP-2)."""

    def get(self, signal: EntityId) -> Signal: ...
    def add(self, signal: Signal) -> None: ...


class SignalScoreRepository(Protocol):
    """Append-only repository of immutable signal scores. Interface only."""

    def get(self, signal: EntityId) -> SignalScore: ...
    def add(self, signal: EntityId, score: SignalScore) -> None: ...


class SignalDependencyRepository(Protocol):
    """Retrieval of a signal's declared dependencies. Interface only."""

    def dependencies_of(self, signal: EntityId) -> tuple[SignalDependency, ...]: ...
