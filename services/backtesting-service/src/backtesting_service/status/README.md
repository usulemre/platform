# backtesting-service · status

> **Phase 2.5 Backtesting Engine — deterministic engine, interfaces only.** Deterministic,
> reproducible, technology-independent, immutable, auditable. No simulation algorithms, no statistical
> calculations, no production execution, no broker/market connectivity, no persistence, no
> infrastructure, no API. It produces reproducible performance EVIDENCE; it never adjudicates.

## Purpose

Define BacktestStatus: the current lifecycle state plus the supplied time it was entered.

## Responsibilities

Represent backtest status as an immutable value object; hold no logic.

## Relationships

Consumed by model and metadata.

## Dependencies

lifecycle (BacktestLifecycle); standard library.

## Related Governance Documents

CLAUDE.md (CP-2/7, CS-3); Architecture V2 §5.6; RB-11 · BT.
