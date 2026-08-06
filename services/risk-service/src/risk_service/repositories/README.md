# risk-service · repositories

> **Phase 2.6 Risk Engine — deterministic governance layer, interfaces only.** Deterministic,
> independent, immutable, auditable, governance-compliant. No numerical risk algorithms, no VaR/stress
> calculations, no execution authority, no broker integration, no persistence, no infrastructure, no
> API. It evaluates and decides deterministically; no AI decides risk.

## Purpose

Define the Risk Engine repository interfaces: RiskAssessmentRepositoryContract (append-only), RiskReportRepository.

## Responsibilities

Express append-only, immutable retrieval of risk assessments and reports as interfaces; hold no persistence.

## Relationships

Consumed by management; complements core_domain.risk repositories.

## Dependencies

core_domain.shared (EntityId); model; reporting.

## Related Governance Documents

CLAUDE.md (CP-2/7, RS-1); Architecture V2 §5.7; RB-13 · RISK.
