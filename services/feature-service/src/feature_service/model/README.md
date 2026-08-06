# feature-service · model

> **Phase 2.4 Feature Service — orchestration/model, interfaces only.** Deterministic, technology-
> independent, immutable, auditable, traceable, versioned. No factor calculation, no feature-
> engineering implementation, no ML, no statistics, no persistence, no infrastructure, no API. It
> orchestrates and records; it never computes features and never adjudicates.

## Purpose

Define the canonical feature models: Feature (aggregate), FeatureIdentifier, FeatureDefinition, FeatureFormulaReference, FeatureEvidence, FeatureValidationReference (reusing core FeatureSpec/AcceptanceStatus).

## Responsibilities

Represent a feature as an immutable, declarative, PIT-bound, provenance-bearing, versioned aggregate that references (never computes) its formula/inputs; hold no logic, no calculation, no adjudication.

## Relationships

Consumed by every Feature Service module; references datasets/validation-reports by identity; reuses core_domain.feature.

## Dependencies

core_domain.feature (FeatureSpec, AcceptanceStatus); core_domain.shared (AggregateRoot, ContentAddress, Provenance, Ref, Version); classification; ownership; status.

## Related Governance Documents

CLAUDE.md (FA-1..4, PIT-3, DP-3, CP-2/5/7, AD-1, NM-2); Architecture V2 §5.5, §5.8, §6.1; RB-09/10 · FAR; P1-06, P2-03.
