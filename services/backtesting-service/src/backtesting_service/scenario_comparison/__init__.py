"""Scenario Comparison — the immutable scenario-comparison model and INTERFACE (references only)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from core_domain.shared import EntityId, Ref


@dataclass(frozen=True, slots=True)
class ScenarioComparison:
    """An immutable comparison across scenarios (references to each scenario's result artifact)."""

    baseline: str
    scenarios: tuple[str, ...]
    result_refs: tuple[Ref, ...]


class ScenarioComparisonService(Protocol):
    """Compares scenario results deterministically (references only; no statistics). Interface only."""

    def compare(self, backtest: EntityId, scenarios: tuple[str, ...]) -> ScenarioComparison: ...
