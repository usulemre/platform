# feature-service · errors

> **Phase 2.4 Feature Service — orchestration/model, interfaces only.** Deterministic, technology-
> independent, immutable, auditable, traceable, versioned. No factor calculation, no feature-
> engineering implementation, no ML, no statistics, no persistence, no infrastructure, no API. It
> orchestrates and records; it never computes features and never adjudicates.

## Purpose

Define the Feature Service errors: FeatureNotRegistered, LeakageNotCleared, LookAheadComputation, MissingFeatureProvenance, ImmutableVersionMutation, FeatureSelfAdjudication, IsolationBarrierBreach, IllegalFeatureTransition, UndeclaredDependency.

## Responsibilities

Express violated feature invariants (register-before-use, leakage clearance, PIT, provenance, immutability, separation of powers, isolation, lifecycle, declared dependencies) as errors.

## Relationships

Used across the Feature Service modules.

## Dependencies

core_domain.shared (DomainError).

## Related Governance Documents

CLAUDE.md (FA-1..4, PIT-3, CP-2/5/6, AD-3, FB-7/11, SE-2); Architecture V2 §5.5, §6.1; RB-09/10 · FAR; P1-06, P2-03/07.
