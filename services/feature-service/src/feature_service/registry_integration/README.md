# feature-service · registry_integration

> **Phase 2.4 Feature Service — orchestration/model, interfaces only.** Deterministic, technology-
> independent, immutable, auditable, traceable, versioned. No factor calculation, no feature-
> engineering implementation, no ML, no statistics, no persistence, no infrastructure, no API. It
> orchestrates and records; it never computes features and never adjudicates.

## Purpose

Define FeatureRegistryPort: the integration port to the Feature Registry / Marketplace.

## Responsibilities

Integrate register-before-use, immutable/versioned registration and Marketplace publication as an interface; hold no persistence.

## Relationships

Consumed by registration/management; delegates to core_domain.feature repositories and the Feature Registry.

## Dependencies

core_domain.shared (EntityId); model.

## Related Governance Documents

CLAUDE.md (FA-1..4, CP-2/7); Architecture V2 §5.5; RB-09/10 · FAR; Feature Registry.
