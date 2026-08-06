# backtesting-service · policies

> **Phase 2.5 Backtesting Engine — deterministic engine, interfaces only.** Deterministic,
> reproducible, technology-independent, immutable, auditable. No simulation algorithms, no statistical
> calculations, no production execution, no broker/market connectivity, no persistence, no
> infrastructure, no API. It produces reproducible performance EVIDENCE; it never adjudicates.

## Purpose

Define the deterministic backtest policy interfaces: BacktestPolicy, PointInTimePolicy, ReproducibilityPolicy, NetOfCostPolicy, NoManualEditPolicy, NoProductionExecutionPolicy.

## Responsibilities

Express the backtesting-standards rules (simulated clock, reproducibility, net-of-cost, no manual edits, no production execution) as interfaces; hold no logic.

## Relationships

Enforced by deterministic engines; consumed by engine/management.

## Dependencies

core_domain.shared (EntityId); standard library.

## Related Governance Documents

CLAUDE.md (BT-1..4, PIT-4, RP-2, AD-1, DE-1); Architecture V2 §5.6, §6.3; RB-11 · BT; P1-02, P3-16.
