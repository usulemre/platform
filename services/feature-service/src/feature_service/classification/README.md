# feature-service · classification

> **Phase 2.4 Feature Service — orchestration/model, interfaces only.** Deterministic, technology-
> independent, immutable, auditable, traceable, versioned. No factor calculation, no feature-
> engineering implementation, no ML, no statistics, no persistence, no infrastructure, no API. It
> orchestrates and records; it never computes features and never adjudicates.

## Purpose

Define FeatureClassification with FeatureKind and FeatureDomain enums (asset-agnostic option preserved).

## Responsibilities

Classify features within the shared feature/factor ontology; the core never branches on asset class; data only.

## Relationships

Consumed by model, metadata, discovery, specifications.

## Dependencies

Standard library only.

## Related Governance Documents

CLAUDE.md (KM-3, CP-8, NM-1); Architecture V2 §5.5; RB-09/10 · FAR; Feature Registry.
