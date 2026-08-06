# risk-service · limits

> **Phase 2.6 Risk Engine — deterministic governance layer, interfaces only.** Deterministic,
> independent, immutable, auditable, governance-compliant. No numerical risk algorithms, no VaR/stress
> calculations, no execution authority, no broker integration, no persistence, no infrastructure, no
> API. It evaluates and decides deterministically; no AI decides risk.

## Purpose

Define the LimitManagementService and re-export the deterministic RiskLimit (from core_domain.risk).

## Responsibilities

Manage deterministic, versioned risk limits; delegate evaluation to the deterministic RiskLimitEngine; hold no numerical logic.

## Relationships

Consumed by model (profile), pipeline, exposure; reuses core_domain.risk.RiskLimit / RiskLimitEngine.

## Dependencies

core_domain.risk (RiskLimit); core_domain.shared (EntityId); standard library.

## Related Governance Documents

CLAUDE.md (RS-1, DE-1/2); Architecture V2 §5.7; RB-13 · RISK; P1-03.
