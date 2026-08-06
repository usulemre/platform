# backtesting-service · specifications

> **Phase 2.5 Backtesting Engine — deterministic engine, interfaces only.** Deterministic,
> reproducible, technology-independent, immutable, auditable. No simulation algorithms, no statistical
> calculations, no production execution, no broker/market connectivity, no persistence, no
> infrastructure, no API. It produces reproducible performance EVIDENCE; it never adjudicates.

## Purpose

Define composable STRUCTURAL backtest specifications: BacktestSpecification, ReadyToRunSpecification, ReproducibleSpecification, InstitutionalRealismSpecification.

## Responsibilities

Express reusable, composable structural readiness/reproducibility/realism predicates; never judge significance or decide promotion; hold no logic.

## Relationships

Composed by management; the promotion decision is the deterministic Statistics/Validation engines'.

## Dependencies

Standard library only.

## Related Governance Documents

CLAUDE.md (DE-1, AI-2, BT-1/2, RP-1, SE-3); Architecture V2 §5.6, §6.3; RB-11 · BT; P3-16.
