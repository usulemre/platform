# signal-service · generation

> **Phase 2.7 Signal Engine — deterministic decision layer, interfaces only.** Deterministic,
> immutable, auditable, traceable. No signal-generation algorithms, no ranking algorithms, no scoring
> formulas, no ML, no portfolio construction, no execution authority, no broker, no persistence, no
> infrastructure, no API. It decides deterministically; it never constructs portfolios or executes.

## Purpose

Define SignalGenerationService: coordinate deterministic signal generation from validated evidence.

## Responsibilities

Coordinate standardizing a validated output into a signal via the deterministic engine; run no algorithm/ML; net-of-cost; never observe validation/OOS; hold no logic.

## Relationships

core_domain.shared (EntityId); decision (SignalDecision); consumes validated features/experiment/backtest evidence.

## Dependencies

Consumed by management; the deterministic generation engine plugs in behind the interface.

## Related Governance Documents

CLAUDE.md (AD-1/3, DE-1, AI-1); Architecture V2 §5.5, §6.1, §6.3; RB-09/10 · FAR; P2-07.
