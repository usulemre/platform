# risk-service · constraints

> **Phase 2.6 Risk Engine — deterministic governance layer, interfaces only.** Deterministic,
> independent, immutable, auditable, governance-compliant. No numerical risk algorithms, no VaR/stress
> calculations, no execution authority, no broker integration, no persistence, no infrastructure, no
> API. It evaluates and decides deterministically; no AI decides risk.

## Purpose

Define RiskConstraint, ConstraintSeverity, and RiskConstraintService: deterministic risk constraints and their governed management.

## Responsibilities

Represent constraints as immutable data with a management interface; hold no evaluation logic (a deterministic engine evaluates them); hard-constraint breaches block progression.

## Relationships

Consumed by model (profile), pipeline, specifications.

## Dependencies

core_domain.shared (EntityId); standard library.

## Related Governance Documents

CLAUDE.md (RS-1, DE-1); Architecture V2 §5.7; RB-13 · RISK; P1-03.
