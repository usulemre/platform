# feature-service · dependencies

> **Phase 2.4 Feature Service — orchestration/model, interfaces only.** Deterministic, technology-
> independent, immutable, auditable, traceable, versioned. No factor calculation, no feature-
> engineering implementation, no ML, no statistics, no persistence, no infrastructure, no API. It
> orchestrates and records; it never computes features and never adjudicates.

## Purpose

Define FeatureDependency, DependencyKind, and FeatureDependencyService: declared links from a feature to datasets, upstream features, research, experiments, and validation.

## Responsibilities

Represent cross-context dependencies by identity only; declare all dependencies explicitly; never create an isolation-barrier-breaching channel; hold no logic.

## Relationships

Consumed by management, lineage, repositories; connects to Data Platform/Research/Experiment/Validation by reference.

## Dependencies

core_domain.shared (EntityId, Ref); standard library.

## Related Governance Documents

CLAUDE.md (SE-2, AC-1/3, AD-3, DP-2); Architecture V2 §5.5, §6.1; RB-09/10 · FAR; P2-07.
