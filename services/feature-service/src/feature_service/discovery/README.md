# feature-service · discovery

> **Phase 2.4 Feature Service — orchestration/model, interfaces only.** Deterministic, technology-
> independent, immutable, auditable, traceable, versioned. No factor calculation, no feature-
> engineering implementation, no ML, no statistics, no persistence, no infrastructure, no API. It
> orchestrates and records; it never computes features and never adjudicates.

## Purpose

Define FeatureDiscoveryQuery, FeatureDiscoveryResult, and the FeatureDiscovery interface: discovery over the Feature Marketplace.

## Responsibilities

Expose discovery of accepted features by text/classification; hold no storage.

## Relationships

Consumes metadata/classification; backed by the Feature Registry/Marketplace.

## Dependencies

feature_service.classification, feature_service.metadata.

## Related Governance Documents

CLAUDE.md (DP-1, FA-4); Architecture V2 §5.5; RB-09/10 · FAR; Feature Registry.
