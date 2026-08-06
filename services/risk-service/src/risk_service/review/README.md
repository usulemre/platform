# risk-service · review

> **Phase 2.6 Risk Engine — deterministic governance layer, interfaces only.** Deterministic,
> independent, immutable, auditable, governance-compliant. No numerical risk algorithms, no VaR/stress
> calculations, no execution authority, no broker integration, no persistence, no infrastructure, no
> API. It evaluates and decides deterministically; no AI decides risk.

## Purpose

Define RiskReviewService: independent (2nd-line) risk review and governed exception handling.

## Responsibilities

Provide independent review of the deterministic assessment; handle governed, recorded exceptions; never bypass a hard control; hold no logic.

## Relationships

core_domain.shared (EntityId); reviews the model.RiskAssessment.

## Dependencies

Consumed by management; precedes approval.

## Related Governance Documents

CLAUDE.md (RS-2, HO-2/3, CP-5); Architecture V2 §5.7, §6.2; RB-13 · RISK.
