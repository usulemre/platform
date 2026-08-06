# feature-service · events

> **Phase 2.4 Feature Service — orchestration/model, interfaces only.** Deterministic, technology-
> independent, immutable, auditable, traceable, versioned. No factor calculation, no feature-
> engineering implementation, no ML, no statistics, no persistence, no infrastructure, no API. It
> orchestrates and records; it never computes features and never adjudicates.

## Purpose

Define the canonical feature domain events: FeatureRegistered, FeatureVersionCreated, FeatureValidated, FeatureApproved, FeatureActivated, FeatureDeprecated, FeatureArchived, FeatureDependencyAdded, FeatureLineageUpdated.

## Responsibilities

Represent feature lifecycle facts as immutable domain events; FeatureValidated records a deterministic-engine outcome, it does not assert it.

## Relationships

core_domain.shared (DomainEvent, EntityId); align with core_domain.feature events.

## Dependencies

Published to the bus/audit.

## Related Governance Documents

CLAUDE.md (CP-2/7, CP-5); Architecture V2 §5.5, §5.10; RB-09/10 · FAR; Feature Registry.
