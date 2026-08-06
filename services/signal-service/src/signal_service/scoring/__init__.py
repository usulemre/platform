"""Signal Scoring — the score/confidence VALUE model and scoring INTERFACE (no formula here).

Scores/confidence are VALUES computed by the deterministic scoring engine and referenced here; this
module holds NO scoring formula and no ML.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from core_domain.shared import EntityId


@dataclass(frozen=True, slots=True)
class SignalScore:
    """A deterministic signal score VALUE (computed by the deterministic engine; no formula here)."""

    value: float
    method_ref: str  # reference to the deterministic scoring method (not the formula)


@dataclass(frozen=True, slots=True)
class SignalConfidence:
    """A deterministic confidence VALUE associated with a signal (no formula here)."""

    value: float


class SignalScoringService(Protocol):
    """Assigns a deterministic score to a signal (via the deterministic scoring engine). Interface only.

    It carries no scoring formula and runs no ML; the value is produced by the deterministic engine.
    """

    def score(self, signal: EntityId) -> SignalScore: ...
    def confidence(self, signal: EntityId) -> SignalConfidence: ...
