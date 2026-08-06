# backtesting-service · events

> **Phase 2.5 Backtesting Engine — deterministic engine, interfaces only.** Deterministic,
> reproducible, technology-independent, immutable, auditable. No simulation algorithms, no statistical
> calculations, no production execution, no broker/market connectivity, no persistence, no
> infrastructure, no API. It produces reproducible performance EVIDENCE; it never adjudicates.

## Purpose

Define the canonical backtest domain events: BacktestCreated, BacktestConfigured, BacktestStarted, BacktestCompleted, BacktestValidated, BacktestApproved, BacktestArchived, ScenarioCompared, PerformanceReportGenerated.

## Responsibilities

Represent backtest lifecycle facts as immutable domain events; BacktestValidated records a deterministic-engine outcome, it does not assert it.

## Relationships

core_domain.shared (DomainEvent, EntityId).

## Dependencies

Published to the bus/audit.

## Related Governance Documents

CLAUDE.md (CP-2/7, CP-5); Architecture V2 §5.6, §5.10; RB-11 · BT.
