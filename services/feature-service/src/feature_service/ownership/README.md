# feature-service · ownership

> **Phase 2.4 Feature Service — orchestration/model, interfaces only.** Deterministic, technology-
> independent, immutable, auditable, traceable, versioned. No factor calculation, no feature-
> engineering implementation, no ML, no statistics, no persistence, no infrastructure, no API. It
> orchestrates and records; it never computes features and never adjudicates.

## Purpose

Define FeatureOwner and the FeatureOwnershipService interface: accountable ownership and its transfer.

## Responsibilities

Represent accountable ownership as data and its transfer as a recorded, interface-only operation; hold no logic.

## Relationships

Consumed by model, metadata, management.

## Dependencies

core_domain.shared (EntityId); standard library.

## Related Governance Documents

CLAUDE.md (CP-7, HO-1); Architecture V2 §5.5; RB-09/10 · FAR.
