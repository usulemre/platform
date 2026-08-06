# backtesting-service · engine

> **Phase 2.5 Backtesting Engine — deterministic engine, interfaces only.** Deterministic,
> reproducible, technology-independent, immutable, auditable. No simulation algorithms, no statistical
> calculations, no production execution, no broker/market connectivity, no persistence, no
> infrastructure, no API. It produces reproducible performance EVIDENCE; it never adjudicates.

## Purpose

Define BacktestEngine and BacktestRunner: the deterministic engine and runner interfaces.

## Responsibilities

Express deterministic, reproducible run execution as interfaces (same engine for backtest/paper/live by injected clock); hold no simulation algorithm, statistics, or connectivity.

## Relationships

core_domain.shared (EntityId, RunManifestRef); context; scenario; result_management.

## Dependencies

The concrete engine plugs in behind these interfaces (golden-tested, reproducible).

## Related Governance Documents

CLAUDE.md (DE-1/2, BT-1, PIT-4, RP-1, AV2-23); Architecture V2 §5.6, §5.9, §6.3; RB-11 · BT; P1-02.
