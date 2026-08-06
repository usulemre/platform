# backtesting-service · performance_reporting

> **Phase 2.5 Backtesting Engine — deterministic engine, interfaces only.** Deterministic,
> reproducible, technology-independent, immutable, auditable. No simulation algorithms, no statistical
> calculations, no production execution, no broker/market connectivity, no persistence, no
> infrastructure, no API. It produces reproducible performance EVIDENCE; it never adjudicates.

## Purpose

Define PerformanceReport, ExecutionSummary, and PerformanceReportingService: the immutable performance report model and its generation interface.

## Responsibilities

Aggregate deterministic outputs by reference (deflated metrics, attribution, capacity, execution summary); compute no statistics; present nothing undeflated; hold no logic.

## Relationships

core_domain.shared (EntityId, Ref, RunManifestRef); references the deterministic Statistics engine outputs.

## Dependencies

Consumed by result_management and scenario_comparison.

## Related Governance Documents

CLAUDE.md (SI-3, BT-3, CP-2, AI-2); Architecture V2 §5.6; RB-11 · BT; RB-01 · STAT.
