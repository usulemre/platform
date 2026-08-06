# backtesting-service · configuration

> **Phase 2.5 Backtesting Engine — deterministic engine, interfaces only.** Deterministic,
> reproducible, technology-independent, immutable, auditable. No simulation algorithms, no statistical
> calculations, no production execution, no broker/market connectivity, no persistence, no
> infrastructure, no API. It produces reproducible performance EVIDENCE; it never adjudicates.

## Purpose

Define BacktestConfiguration, CostModelReference, and BacktestConfigurationService: the immutable, reproducibility-bearing configuration with institutional-realism references.

## Responsibilities

Represent configuration (config hash, feature/universe references, horizon, cost model, non-secret params) as immutable data bound into the manifest; declare realism by reference; hold no algorithm.

## Relationships

Consumed by model, scenario, engine, simulation_coordination; references features/universe by identity.

## Dependencies

core_domain.shared (EntityId, Ref); standard library.

## Related Governance Documents

CLAUDE.md (BT-2, AD-1, PIT-2, RP-1, SEC-3, SE-2); Architecture V2 §5.6; RB-11 · BT; P3-16.
