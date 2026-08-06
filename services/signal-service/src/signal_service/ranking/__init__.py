"""Signal Ranking — the rank model and ranking INTERFACE (no ranking algorithm here)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from core_domain.shared import EntityId


@dataclass(frozen=True, slots=True)
class SignalRank:
    """An immutable rank of a signal (produced by the deterministic ranking engine; no algorithm here)."""

    signal_id: EntityId
    rank: int
    score_ref: str


class SignalRankingService(Protocol):
    """Ranks signals deterministically (via the deterministic ranking engine). Interface only.

    It carries no ranking algorithm; the ordering is produced by the deterministic engine.
    """

    def rank(self, signals: tuple[EntityId, ...]) -> tuple[SignalRank, ...]: ...
