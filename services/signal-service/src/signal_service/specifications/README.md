# signal-service · specifications

> **Phase 2.7 Signal Engine — deterministic decision layer, interfaces only.** Deterministic,
> immutable, auditable, traceable. No signal-generation algorithms, no ranking algorithms, no scoring
> formulas, no ML, no portfolio construction, no execution authority, no broker, no persistence, no
> infrastructure, no API. It decides deterministically; it never constructs portfolios or executes.

## Purpose

Define composable STRUCTURAL signal specifications: SignalSpecification, ReadyForActivationSpecification, GovernanceCompliantSpecification.

## Responsibilities

Express reusable, composable structural readiness/governance predicates; never compute scores/ranks or decide; hold no logic.

## Relationships

Composed by management/governance; scores/ranks are the deterministic engines' outputs.

## Dependencies

Standard library only.

## Related Governance Documents

CLAUDE.md (DE-1, AD-1, RS-1, SE-3); Architecture V2 §5.5, §6.3; RB-09/10 · FAR.
