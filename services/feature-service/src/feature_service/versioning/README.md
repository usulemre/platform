# feature-service · versioning

> **Phase 2.4 Feature Service — orchestration/model, interfaces only.** Deterministic, technology-
> independent, immutable, auditable, traceable, versioned. No factor calculation, no feature-
> engineering implementation, no ML, no statistics, no persistence, no infrastructure, no API. It
> orchestrates and records; it never computes features and never adjudicates.

## Purpose

Define FeatureVersion and FeatureVersioningService: immutable feature versioning with superseding and rollback.

## Responsibilities

Express immutable versioning, superseding, and rollback as data + interfaces; a new version revalidates; history is preserved; hold no logic.

## Relationships

Consumed by management and lifecycle.

## Dependencies

core_domain.shared (ContentAddress, EntityId); model.

## Related Governance Documents

CLAUDE.md (CP-2, FA-4, VER-1/2, RP-4, DEPR-1..3); Architecture V2 §5.5; RB-09/10 · FAR; Feature Registry.
