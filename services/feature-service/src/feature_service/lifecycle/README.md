# feature-service · lifecycle

> **Phase 2.4 Feature Service — orchestration/model, interfaces only.** Deterministic, technology-
> independent, immutable, auditable, traceable, versioned. No factor calculation, no feature-
> engineering implementation, no ML, no statistics, no persistence, no infrastructure, no API. It
> orchestrates and records; it never computes features and never adjudicates.

## Purpose

Define FeatureLifecycle (PROPOSED/REGISTERED/IMPLEMENTED/VALIDATING/APPROVED/ACTIVE/DEPRECATED/ARCHIVED), the canonical transitions (revision/superseding/rollback/retirement), and the lifecycle-service interface.

## Responsibilities

Enumerate the lifecycle and its legal transitions as data; approval/activation require the passed Leakage Harness + validation gate; branching creates new lineage (RL-1); hold no logic.

## Relationships

Consumed by model, status, approval, management, policies.

## Dependencies

core_domain.shared (EntityId); standard library.

## Related Governance Documents

CLAUDE.md (FA-2/4, RL-1/2, CP-5); Architecture V2 §5.5; RB-09/10 · FAR; Feature Registry; P2-03.
