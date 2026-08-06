# feature-service · management

> **Phase 2.4 Feature Service — orchestration/model, interfaces only.** Deterministic, technology-
> independent, immutable, auditable, traceable, versioned. No factor calculation, no feature-
> engineering implementation, no ML, no statistics, no persistence, no infrastructure, no API. It
> orchestrates and records; it never computes features and never adjudicates.

## Purpose

Define the Feature Service interfaces: FeatureService (lifecycle), FeatureManagementService (dependency/lineage/gate orchestration), FeatureCatalogService.

## Responsibilities

Orchestrate the feature lifecycle and connect Data Platform/Research/Experiment/Validation/Feature Registry; record (never compute) deterministic gate outcomes; hold no adjudication, statistics, or feature calculation.

## Relationships

Top-level module: composes model, dependencies, metadata, registration, versioning, validation/registry integration.

## Dependencies

core_domain.shared (EntityId); model; dependencies; metadata.

## Related Governance Documents

CLAUDE.md (CP-5, AI-2, AD-3, DE-1, FA-1..5); Architecture V2 §5.5, §6.1, §6.3; RB-09/10 · FAR; P1-06, P2-03/07.
