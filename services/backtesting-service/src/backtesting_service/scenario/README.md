# backtesting-service · scenario

> **Phase 2.5 Backtesting Engine — deterministic engine, interfaces only.** Deterministic,
> reproducible, technology-independent, immutable, auditable. No simulation algorithms, no statistical
> calculations, no production execution, no broker/market connectivity, no persistence, no
> infrastructure, no API. It produces reproducible performance EVIDENCE; it never adjudicates.

## Purpose

Define BacktestScenario and ScenarioManagementService: named scenario variants over a configuration.

## Responsibilities

Represent scenarios as immutable data with a management interface; hold no logic.

## Relationships

Consumed by engine, session, scenario_comparison.

## Dependencies

core_domain.shared (EntityId); standard library.

## Related Governance Documents

CLAUDE.md (CP-2, RP-1); Architecture V2 §5.6; RB-11 · BT.
