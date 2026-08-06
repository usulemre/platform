# risk-service · reporting

> **Phase 2.6 Risk Engine — deterministic governance layer, interfaces only.** Deterministic,
> independent, immutable, auditable, governance-compliant. No numerical risk algorithms, no VaR/stress
> calculations, no execution authority, no broker integration, no persistence, no infrastructure, no
> API. It evaluates and decides deterministically; no AI decides risk.

## Purpose

Define RiskReport and RiskReportingService: the immutable, explainable risk report and its generation.

## Responsibilities

Aggregate the deterministic decision, measured exposures, and breaches into an explainable report; compute no numerical risk; hold no logic.

## Relationships

core_domain.shared (EntityId); model (RiskDecision); exposure (RiskExposure).

## Dependencies

Consumed by review/management/governance.

## Related Governance Documents

CLAUDE.md (EXP-2, CP-7, RS-1); Architecture V2 §5.7; RB-13 · RISK.
