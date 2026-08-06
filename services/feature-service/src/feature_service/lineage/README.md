# feature-service · lineage

> **Phase 2.4 Feature Service — orchestration/model, interfaces only.** Deterministic, technology-
> independent, immutable, auditable, traceable, versioned. No factor calculation, no feature-
> engineering implementation, no ML, no statistics, no persistence, no infrastructure, no API. It
> orchestrates and records; it never computes features and never adjudicates.

## Purpose

Define FeatureLineage, FeatureLineageEdge, and the FeatureLineageGraph interface (with downstream invalidation).

## Responsibilities

Model complete lineage to raw dataset sources for traceability and enable defect propagation (a source defect invalidates the feature and downstream); hold no persistence or computation.

## Relationships

Consumed by repositories and management; connects to datasets/upstream features by identity.

## Dependencies

core_domain.shared (EntityId, LineageRef, Ref); model.

## Related Governance Documents

CLAUDE.md (CP-6, DP-1/2, DEPR-2); Architecture V2 §5.5, §5.8; RB-09/10 · FAR; Feature Registry.
