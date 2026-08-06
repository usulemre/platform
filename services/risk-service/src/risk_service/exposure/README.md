# risk-service · exposure

> **Phase 2.6 Risk Engine — deterministic governance layer, interfaces only.** Deterministic,
> independent, immutable, auditable, governance-compliant. No numerical risk algorithms, no VaR/stress
> calculations, no execution authority, no broker integration, no persistence, no infrastructure, no
> API. It evaluates and decides deterministically; no AI decides risk.

## Purpose

Define RiskExposure and ExposureGovernanceService: measured exposures governed against deterministic limits.

## Responsibilities

Govern exposures against limits; reference measured values (computed by the deterministic engine); compute no VaR/stress; hold no numerical logic.

## Relationships

Consumed by pipeline, reporting; evaluates against limits.

## Dependencies

core_domain.shared (EntityId); standard library.

## Related Governance Documents

CLAUDE.md (RS-1, DE-1); Architecture V2 §5.7; RB-13 · RISK; P1-03.
