# feature-service · validation_coordination

> **Phase 2.4 Feature Service — orchestration/model, interfaces only.** Deterministic, technology-
> independent, immutable, auditable, traceable, versioned. No factor calculation, no feature-
> engineering implementation, no ML, no statistics, no persistence, no infrastructure, no API. It
> orchestrates and records; it never computes features and never adjudicates.

## Purpose

Define FeatureValidationCoordinator: orchestrate the deterministic Leakage Harness and structural validation (Validation Foundation) before approval/activation.

## Responsibilities

Coordinate leakage clearance (must pass, FA-2) and structural validation; defer significance to the deterministic engine; assert no significance; hold no computation.

## Relationships

core_domain.feature (LeakageReport, LeakageHarness); core_domain.shared (EntityId); platform_validation (ValidationContext, ValidationReport).

## Dependencies

Uses the Validation Foundation for orchestration; gates the transition to APPROVED.

## Related Governance Documents

CLAUDE.md (FA-2, PIT-3, AI-2, DE-1, VS-2); Architecture V2 §5.5, §5.6, §6.3; RB-09/10 · FAR; RB-04 · VAL; P1-06, P2-03.
