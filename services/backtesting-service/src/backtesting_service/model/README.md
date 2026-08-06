# backtesting-service · model

> **Phase 2.5 Backtesting Engine — deterministic engine, interfaces only.** Deterministic,
> reproducible, technology-independent, immutable, auditable. No simulation algorithms, no statistical
> calculations, no production execution, no broker/market connectivity, no persistence, no
> infrastructure, no API. It produces reproducible performance EVIDENCE; it never adjudicates.

## Purpose

Define the canonical backtest models: Backtest (aggregate), BacktestIdentifier, BacktestEvidence (reproducible evidence reference).

## Responsibilities

Represent a backtest as an immutable, manifest-bearing, reproducible aggregate that references its subject/experiment by identity; hold no simulation algorithm, no statistics, no adjudication.

## Relationships

Consumed by every Backtesting Engine module; references Experiment/Feature by identity; reuses the reproducibility spine.

## Dependencies

core_domain.shared (AggregateRoot, Provenance, Ref, RunManifestRef, Version); status.

## Related Governance Documents

CLAUDE.md (BT-1..4, CP-2/4/5/7, RP-1, AI-2, SI-3, NM-2); Architecture V2 §5.6, §6.3; RB-11 · BT; P1-02.
