# feature-service · repositories

> **Phase 2.4 Feature Service — orchestration/model, interfaces only.** Deterministic, technology-
> independent, immutable, auditable, traceable, versioned. No factor calculation, no feature-
> engineering implementation, no ML, no statistics, no persistence, no infrastructure, no API. It
> orchestrates and records; it never computes features and never adjudicates.

## Purpose

Define the Feature Service repository interfaces: FeatureRepositoryContract (append-only), FeatureVersionRepository, FeatureLineageRepository, FeatureDependencyRepository.

## Responsibilities

Express append-only, immutable retrieval of features, versions, lineage, and dependencies as interfaces; hold no persistence; the Marketplace read path is core_domain.feature.FeatureMarketplace.

## Relationships

Consumed by management; complements core_domain.feature repositories and the Feature Registry.

## Dependencies

core_domain.shared (EntityId); model; versioning; lineage; dependencies.

## Related Governance Documents

CLAUDE.md (CP-2, FA-4, DP-1); Architecture V2 §5.5; RB-09/10 · FAR; Feature Registry.
