# backtesting-service · scenario_comparison

> **Phase 2.5 Backtesting Engine — deterministic engine, interfaces only.** Deterministic,
> reproducible, technology-independent, immutable, auditable. No simulation algorithms, no statistical
> calculations, no production execution, no broker/market connectivity, no persistence, no
> infrastructure, no API. It produces reproducible performance EVIDENCE; it never adjudicates.

## Purpose

Define ScenarioComparison and ScenarioComparisonService: the immutable comparison across scenarios.

## Responsibilities

Represent scenario comparisons as immutable references to result artifacts; compute no statistics; hold no logic.

## Relationships

core_domain.shared (EntityId, Ref); references result artifacts.

## Dependencies

Consumed by reporting/management; emits ScenarioCompared.

## Related Governance Documents

CLAUDE.md (CP-2, SI-3, AI-2); Architecture V2 §5.6; RB-11 · BT.
