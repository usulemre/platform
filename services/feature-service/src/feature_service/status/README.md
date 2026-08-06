# feature-service · status

> **Phase 2.4 Feature Service — orchestration/model, interfaces only.** Deterministic, technology-
> independent, immutable, auditable, traceable, versioned. No factor calculation, no feature-
> engineering implementation, no ML, no statistics, no persistence, no infrastructure, no API. It
> orchestrates and records; it never computes features and never adjudicates.

## Purpose

Define FeatureStatus: the current lifecycle state plus the supplied time it was entered.

## Responsibilities

Represent feature status as an immutable value object; hold no logic.

## Relationships

Consumed by model and metadata.

## Dependencies

lifecycle (FeatureLifecycle); standard library.

## Related Governance Documents

CLAUDE.md (CP-2/7, CS-3); Architecture V2 §5.5; RB-09/10 · FAR.
