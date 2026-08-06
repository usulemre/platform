# risk-service · pipeline

> **Phase 2.6 Risk Engine — deterministic governance layer, interfaces only.** Deterministic,
> independent, immutable, auditable, governance-compliant. No numerical risk algorithms, no VaR/stress
> calculations, no execution authority, no broker integration, no persistence, no infrastructure, no
> API. It evaluates and decides deterministically; no AI decides risk.

## Purpose

Define RiskEvaluationPlan, RiskEvaluationStage, RiskCheckKind, and the RiskEvaluationPipeline interface: a composable, deterministic pipeline of risk checks.

## Responsibilities

Compose constraint/limit/exposure/policy checks into a deterministic evaluation yielding a RiskDecision; run no numerical VaR/stress; hold no logic.

## Relationships

core_domain.shared (EntityId); model (RiskDecision); composes constraints/limits/exposure/policies.

## Dependencies

Consumed by assessment/management.

## Related Governance Documents

CLAUDE.md (RS-1, DE-1, SE-3); Architecture V2 §5.7, §6.3; RB-13 · RISK; P1-03.
