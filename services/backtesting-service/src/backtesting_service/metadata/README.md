# backtesting-service · metadata

> **Phase 2.5 Backtesting Engine — deterministic engine, interfaces only.** Deterministic,
> reproducible, technology-independent, immutable, auditable. No simulation algorithms, no statistical
> calculations, no production execution, no broker/market connectivity, no persistence, no
> infrastructure, no API. It produces reproducible performance EVIDENCE; it never adjudicates.

## Purpose

Define BacktestMetadata: the immutable, auditable, provenance-bearing metadata of a backtest.

## Responsibilities

Carry backtest metadata (identity, description, owner, status, provenance, tags) as data; hold no logic.

## Relationships

Consumed by management/reporting and repositories.

## Dependencies

core_domain.shared (Provenance); model; status.

## Related Governance Documents

CLAUDE.md (CP-7, DP-3); Architecture V2 §5.6; RB-11 · BT.
