"""Signal Dependencies — links to features/experiments/backtests/risk/upstream signals (by identity).

All links are by identity/reference (SE-2); none creates a channel that would let generation observe
per-candidate validation/OOS outcomes (the isolation barrier, AD-3, P2-07).
"""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Protocol

from core_domain.shared import EntityId, Ref


class DependencyKind(Enum):
    FEATURE = "feature"
    EXPERIMENT = "experiment"
    BACKTEST = "backtest"
    RISK = "risk"                 # the mandatory approved Risk assessment
    UPSTREAM_SIGNAL = "upstream_signal"


@dataclass(frozen=True, slots=True)
class SignalDependency:
    """A declared dependency of a signal on another artifact, by identity."""

    kind: DependencyKind
    target: Ref


class SignalDependencyService(Protocol):
    """Declares and lists signal dependencies. Interface only — hidden dependencies are PROHIBITED."""

    def declare(self, signal: EntityId, dependency: SignalDependency) -> None: ...
