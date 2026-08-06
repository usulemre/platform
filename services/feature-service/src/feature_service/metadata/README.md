# feature-service · metadata

> **Phase 2.4 Feature Service — orchestration/model, interfaces only.** Deterministic, technology-
> independent, immutable, auditable, traceable, versioned. No factor calculation, no feature-
> engineering implementation, no ML, no statistics, no persistence, no infrastructure, no API. It
> orchestrates and records; it never computes features and never adjudicates.

## Purpose

Define FeatureMetadata: the immutable, auditable, provenance-bearing metadata of a feature.

## Responsibilities

Carry feature metadata (identity, description, classification, owner, status, provenance, tags) as data; hold no logic.

## Relationships

Consumed by discovery, management, repositories.

## Dependencies

core_domain.shared (Provenance); model; classification; ownership; status.

## Related Governance Documents

CLAUDE.md (CP-7, DP-3); Architecture V2 §5.5; RB-09/10 · FAR; Feature Registry.
