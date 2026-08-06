# backtesting-service · result_management

> **Phase 2.5 Backtesting Engine — deterministic engine, interfaces only.** Deterministic,
> reproducible, technology-independent, immutable, auditable. No simulation algorithms, no statistical
> calculations, no production execution, no broker/market connectivity, no persistence, no
> infrastructure, no API. It produces reproducible performance EVIDENCE; it never adjudicates.

## Purpose

Define BacktestResult and BacktestResultService: the immutable, reproducible result artifact and its record/retrieve interface.

## Responsibilities

Represent results as immutable, manifest-referenced artifacts; forbid manual editing (BT-4); append-only; hold no persistence.

## Relationships

core_domain.shared (EntityId, Ref, RunManifestRef); references performance report.

## Dependencies

Consumed by engine, scenario_comparison, repositories.

## Related Governance Documents

CLAUDE.md (BT-3/4, CP-2, RP-1, FB-9); Architecture V2 §5.6; RB-11 · BT; P1-02.
