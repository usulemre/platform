# risk-service · policies

> **Phase 2.6 Risk Engine — deterministic governance layer, interfaces only.** Deterministic,
> independent, immutable, auditable, governance-compliant. No numerical risk algorithms, no VaR/stress
> calculations, no execution authority, no broker integration, no persistence, no infrastructure, no
> API. It evaluates and decides deterministically; no AI decides risk.

## Purpose

Define RiskPolicy (versioned) and the governance policy interfaces: RiskPolicyService, IndependencePolicy, DeterministicDecisionPolicy, NoExecutionAuthorityPolicy.

## Responsibilities

Represent versioned risk policies and express the governance rules (independence, deterministic decisions, no execution authority) as interfaces; hold no logic.

## Relationships

Consumed by model (profile), pipeline, management; enforced by deterministic engines.

## Dependencies

core_domain.shared (EntityId, Version); standard library.

## Related Governance Documents

CLAUDE.md (RS-1/2, CP-5, AI-1, VER-1); Architecture V2 §5.7, §6.3; RB-13 · RISK; P1-03.
