# backtesting-service · session

> **Phase 2.5 Backtesting Engine — deterministic engine, interfaces only.** Deterministic,
> reproducible, technology-independent, immutable, auditable. No simulation algorithms, no statistical
> calculations, no production execution, no broker/market connectivity, no persistence, no
> infrastructure, no API. It produces reproducible performance EVIDENCE; it never adjudicates.

## Purpose

Define BacktestSession and BacktestSessionService: an immutable run-session record and its open/close interface.

## Responsibilities

Bind a run's inputs (backtest, scenario, context) to a Run Manifest as an immutable session; hold no execution or logic.

## Relationships

Consumed by engine and simulation_coordination; references scenario/context.

## Dependencies

core_domain.shared (EntityId, RunManifestRef); context; scenario.

## Related Governance Documents

CLAUDE.md (CP-2, RP-1, OB-1); Architecture V2 §5.6; RB-11 · BT; P1-02.
