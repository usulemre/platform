# backtesting-service · context

> **Phase 2.5 Backtesting Engine — deterministic engine, interfaces only.** Deterministic,
> reproducible, technology-independent, immutable, auditable. No simulation algorithms, no statistical
> calculations, no production execution, no broker/market connectivity, no persistence, no
> infrastructure, no API. It produces reproducible performance EVIDENCE; it never adjudicates.

## Purpose

Define BacktestContext: the immutable, deterministic execution context (simulated clock as-of, seed reference, hardware class).

## Responsibilities

Carry the simulated-time boundary and reproducibility inputs by value; prohibit wall-clock reads; hold no logic.

## Relationships

Consumed by engine, session, simulation_coordination.

## Dependencies

core_domain.shared (AsOf); standard library.

## Related Governance Documents

CLAUDE.md (PIT-4, BT-1, CS-3, RP-1); Architecture V2 §5.6, §2.1; RB-11 · BT; P1-02.
