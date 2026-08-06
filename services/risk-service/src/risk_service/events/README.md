# risk-service · events

> **Phase 2.6 Risk Engine — deterministic governance layer, interfaces only.** Deterministic,
> independent, immutable, auditable, governance-compliant. No numerical risk algorithms, no VaR/stress
> calculations, no execution authority, no broker integration, no persistence, no infrastructure, no
> API. It evaluates and decides deterministically; no AI decides risk.

## Purpose

Define the canonical risk domain events: RiskAssessmentRequested, RiskAssessmentCompleted, RiskValidated, RiskApproved, RiskRejected, RiskConstraintViolated, RiskPolicyUpdated, RiskReportGenerated.

## Responsibilities

Represent risk lifecycle facts as immutable domain events; RiskValidated records a deterministic-engine outcome.

## Relationships

core_domain.shared (DomainEvent, EntityId); align with core_domain.risk events.

## Dependencies

Published to the bus/audit.

## Related Governance Documents

CLAUDE.md (CP-2/7, RS-1); Architecture V2 §5.7, §5.10; RB-13 · RISK.
