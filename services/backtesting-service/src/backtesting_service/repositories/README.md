# backtesting-service · repositories

> **Phase 2.5 Backtesting Engine — deterministic engine, interfaces only.** Deterministic,
> reproducible, technology-independent, immutable, auditable. No simulation algorithms, no statistical
> calculations, no production execution, no broker/market connectivity, no persistence, no
> infrastructure, no API. It produces reproducible performance EVIDENCE; it never adjudicates.

## Purpose

Define the Backtesting Engine repository interfaces: BacktestRepositoryContract, BacktestResultRepository, BacktestSessionRepository (all append-only).

## Responsibilities

Express append-only, immutable retrieval of backtests, results, and sessions as interfaces; results are never edited (BT-4); hold no persistence.

## Relationships

Consumed by management/reporting/reproducibility.

## Dependencies

core_domain.shared (EntityId); model; result_management; session.

## Related Governance Documents

CLAUDE.md (CP-2, BT-3/4, RP-4); Architecture V2 §5.6; RB-11 · BT; P1-02.
