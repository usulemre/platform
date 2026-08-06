# signal-service · decision

> **Phase 2.7 Signal Engine — deterministic decision layer, interfaces only.** Deterministic,
> immutable, auditable, traceable. No signal-generation algorithms, no ranking algorithms, no scoring
> formulas, no ML, no portfolio construction, no execution authority, no broker, no persistence, no
> infrastructure, no API. It decides deterministically; it never constructs portfolios or executes.

## Purpose

Define SignalDecision and DecisionVerdict: the deterministic, explainable decision to standardize a validated output into a signal.

## Responsibilities

Represent the signal decision as immutable, deterministic, explainable data; never AI/ML-decided; hold no logic.

## Relationships

Consumed by generation, management.

## Dependencies

Standard library only.

## Related Governance Documents

CLAUDE.md (DE-1, AI-1, EXP-2); Architecture V2 §5.5, §6.3; RB-09/10 · FAR.
