# signal-service · classification

> **Phase 2.7 Signal Engine — deterministic decision layer, interfaces only.** Deterministic,
> immutable, auditable, traceable. No signal-generation algorithms, no ranking algorithms, no scoring
> formulas, no ML, no portfolio construction, no execution authority, no broker, no persistence, no
> infrastructure, no API. It decides deterministically; it never constructs portfolios or executes.

## Purpose

Define SignalClassification with SignalKind and SignalHorizon enums.

## Responsibilities

Classify signals within the shared ontology by kind and horizon; data only.

## Relationships

Consumed by model, metadata, specifications.

## Dependencies

Standard library only.

## Related Governance Documents

CLAUDE.md (KM-3, CP-8, NM-1); Architecture V2 §5.5; RB-09/10 · FAR; Signal Registry.
