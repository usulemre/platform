# feature-service · registration

> **Phase 2.4 Feature Service — orchestration/model, interfaces only.** Deterministic, technology-
> independent, immutable, auditable, traceable, versioned. No factor calculation, no feature-
> engineering implementation, no ML, no statistics, no persistence, no infrastructure, no API. It
> orchestrates and records; it never computes features and never adjudicates.

## Purpose

Define FeatureRegistrationService: register-before-use registration with a declarative definition and provenance.

## Responsibilities

Orchestrate feature registration; require the declarative definition and provenance; acceptance is gated by the deterministic Leakage Harness; hold no computation.

## Relationships

Consumed by management; precedes validation_coordination and approval.

## Dependencies

core_domain.shared (EntityId); model.

## Related Governance Documents

CLAUDE.md (FA-1..4, DP-1); Architecture V2 §5.5; RB-09/10 · FAR; Feature Registry; P2-03.
