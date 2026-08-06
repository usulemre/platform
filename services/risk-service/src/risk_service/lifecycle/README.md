# risk-service · lifecycle

> **Phase 2.6 Risk Engine — deterministic governance layer, interfaces only.** Deterministic,
> independent, immutable, auditable, governance-compliant. No numerical risk algorithms, no VaR/stress
> calculations, no execution authority, no broker integration, no persistence, no infrastructure, no
> API. It evaluates and decides deterministically; no AI decides risk.

## Purpose

Define RiskLifecycle (REQUESTED/ASSESSING/VALIDATING/REVIEWED/APPROVED/ACTIVE/RETIRED + REJECTED), the canonical transitions (reassessment/rejection/exception), and the lifecycle-service interface.

## Responsibilities

Enumerate the lifecycle and legal transitions as data; policy/constraint revision triggers reassessment; hold no logic and no AI decision.

## Relationships

Consumed by model, status, approval, review, management, policies.

## Dependencies

core_domain.shared (EntityId); standard library.

## Related Governance Documents

CLAUDE.md (RS-1/2, AI-1, RL-1); Architecture V2 §5.7; RB-13 · RISK.
