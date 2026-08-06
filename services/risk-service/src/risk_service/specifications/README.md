# risk-service · specifications

> **Phase 2.6 Risk Engine — deterministic governance layer, interfaces only.** Deterministic,
> independent, immutable, auditable, governance-compliant. No numerical risk algorithms, no VaR/stress
> calculations, no execution authority, no broker integration, no persistence, no infrastructure, no
> API. It evaluates and decides deterministically; no AI decides risk.

## Purpose

Define composable STRUCTURAL risk specifications: RiskSpecification, WithinGovernanceSpecification, PromotionEligibilitySpecification.

## Responsibilities

Express reusable, composable structural governance predicates; never judge numerical risk or decide promotion; hold no logic.

## Relationships

Composed by management; the risk decision is the deterministic engine's + independent sign-off's.

## Dependencies

Standard library only.

## Related Governance Documents

CLAUDE.md (DE-1, RS-1/2, SE-3); Architecture V2 §5.7, §6.3; RB-13 · RISK; P2-09.
