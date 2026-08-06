# backtesting-service · simulation_coordination

> **Phase 2.5 Backtesting Engine — deterministic engine, interfaces only.** Deterministic,
> reproducible, technology-independent, immutable, auditable. No simulation algorithms, no statistical
> calculations, no production execution, no broker/market connectivity, no persistence, no
> infrastructure, no API. It produces reproducible performance EVIDENCE; it never adjudicates.

## Purpose

Define HistoricalSimulationCoordinator: coordinate the deterministic historical simulation over the simulated clock.

## Responsibilities

Delegate to the deterministic simulation engine; read only PIT data via the As-Of Gateway; apply realism by reference; run no algorithm and no market connectivity; hold no logic.

## Relationships

core_domain.shared (EntityId, RunManifestRef); context; delegates to the deterministic simulation engine.

## Dependencies

Consumed by engine; precedes validation_coordination.

## Related Governance Documents

CLAUDE.md (BT-1/2, PIT-1/4, DE-1, RP-1); Architecture V2 §5.6, §6.3, §6.4; RB-11 · BT; P3-16, P1-02.
