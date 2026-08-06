# backtesting-service · errors

> **Phase 2.5 Backtesting Engine — deterministic engine, interfaces only.** Deterministic,
> reproducible, technology-independent, immutable, auditable. No simulation algorithms, no statistical
> calculations, no production execution, no broker/market connectivity, no persistence, no
> infrastructure, no API. It produces reproducible performance EVIDENCE; it never adjudicates.

## Purpose

Define the Backtesting Engine errors: NonPointInTimeRead, IrreproducibleBacktest, ManualResultEdit, ProductionExecutionAttempt, GrossPerformanceReported, UndeflatedPerformanceReported, MissingCapacityAssessment, IllegalBacktestTransition.

## Responsibilities

Express violated backtesting invariants (point-in-time, reproducibility, no manual edits, no production execution, net-of-cost, deflation, capacity, lifecycle) as errors.

## Relationships

Used across the Backtesting Engine modules.

## Dependencies

core_domain.shared (DomainError).

## Related Governance Documents

CLAUDE.md (BT-1..4, PIT-4, RP-2, SI-3, AD-1/4, FB-7/9); Architecture V2 §5.6; RB-11 · BT; P3-16.
