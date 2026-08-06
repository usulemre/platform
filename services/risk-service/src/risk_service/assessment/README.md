# risk-service · assessment

> **Phase 2.6 Risk Engine — deterministic governance layer, interfaces only.** Deterministic,
> independent, immutable, auditable, governance-compliant. No numerical risk algorithms, no VaR/stress
> calculations, no execution authority, no broker integration, no persistence, no infrastructure, no
> API. It evaluates and decides deterministically; no AI decides risk.

## Purpose

Define RiskAssessmentService: coordinate a deterministic, independent risk assessment of a research output.

## Responsibilities

Coordinate assessment against policies/constraints/limits using Backtesting evidence; produce a deterministic verdict; compute no numerical risk; hold no logic.

## Relationships

core_domain.shared (EntityId); consumes Backtesting evidence; produces the model.RiskAssessment.

## Dependencies

Consumed by management; precedes validation/review/approval.

## Related Governance Documents

CLAUDE.md (RS-1/2, AI-1, DE-1); Architecture V2 §5.7, §6.3; RB-13 · RISK; P1-03.
