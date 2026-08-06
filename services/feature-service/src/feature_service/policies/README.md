# feature-service · policies

> **Phase 2.4 Feature Service — orchestration/model, interfaces only.** Deterministic, technology-
> independent, immutable, auditable, traceable, versioned. No factor calculation, no feature-
> engineering implementation, no ML, no statistics, no persistence, no infrastructure, no API. It
> orchestrates and records; it never computes features and never adjudicates.

## Purpose

Define the deterministic feature policy interfaces: FeaturePolicy, AsOfComputationPolicy, LeakageClearancePolicy, ProvenanceRequiredPolicy, ImmutabilityPolicy.

## Responsibilities

Express the feature-acceptance rules (as-of computation, leakage clearance, provenance-required, immutability) as interfaces; hold no logic.

## Relationships

Enforced by deterministic engines; consumed by management.

## Dependencies

core_domain.shared (EntityId); standard library.

## Related Governance Documents

CLAUDE.md (FA-1..4, PIT-3, DP-3, CP-2, DE-1); Architecture V2 §5.5, §5.8; RB-09/10 · FAR; P1-06, P2-03.
