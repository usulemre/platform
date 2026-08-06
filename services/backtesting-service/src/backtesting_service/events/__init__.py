"""Backtest Domain Events — immutable facts about a backtest (subclass the event envelope)."""
from __future__ import annotations

from dataclasses import dataclass

from core_domain.shared import DomainEvent, EntityId


@dataclass(frozen=True, slots=True)
class BacktestCreated(DomainEvent):
    backtest_id: EntityId


@dataclass(frozen=True, slots=True)
class BacktestConfigured(DomainEvent):
    backtest_id: EntityId


@dataclass(frozen=True, slots=True)
class BacktestStarted(DomainEvent):
    backtest_id: EntityId


@dataclass(frozen=True, slots=True)
class BacktestCompleted(DomainEvent):
    """The deterministic run completed and produced a reproducible result (BT-3)."""

    backtest_id: EntityId
    result_manifest: str


@dataclass(frozen=True, slots=True)
class BacktestValidated(DomainEvent):
    """Records that the deterministic validation gate passed (the engine decided, not us)."""

    backtest_id: EntityId


@dataclass(frozen=True, slots=True)
class BacktestApproved(DomainEvent):
    backtest_id: EntityId


@dataclass(frozen=True, slots=True)
class BacktestArchived(DomainEvent):
    backtest_id: EntityId


@dataclass(frozen=True, slots=True)
class ScenarioCompared(DomainEvent):
    backtest_id: EntityId


@dataclass(frozen=True, slots=True)
class PerformanceReportGenerated(DomainEvent):
    backtest_id: EntityId
