# risk-service · errors

> **Phase 2.6 Risk Engine — deterministic governance layer, interfaces only.** Deterministic,
> independent, immutable, auditable, governance-compliant. No numerical risk algorithms, no VaR/stress
> calculations, no execution authority, no broker integration, no persistence, no infrastructure, no
> API. It evaluates and decides deterministically; no AI decides risk.

## Purpose

Define the Risk Engine errors: AIRiskDecision, RiskIndependenceViolation, HardConstraintBreach, ExecutionAuthorityAttempt, GovernanceBypass, MissingPerformanceEvidence, IllegalRiskTransition.

## Responsibilities

Express violated risk-governance invariants (deterministic decision, independence, hard-limit breach, no execution authority, no control bypass, evidence-required, lifecycle) as errors.

## Relationships

Used across the Risk Engine modules.

## Dependencies

core_domain.shared (DomainError); aligns with core_domain.risk errors.

## Related Governance Documents

CLAUDE.md (RS-1/2, AI-1, HO-3, CP-5); Architecture V2 §5.7, §6.3; RB-13 · RISK; P1-03.
