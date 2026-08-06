# risk-service · approval

> **Phase 2.6 Risk Engine — deterministic governance layer, interfaces only.** Deterministic,
> independent, immutable, auditable, governance-compliant. No numerical risk algorithms, no VaR/stress
> calculations, no execution authority, no broker integration, no persistence, no infrastructure, no
> API. It evaluates and decides deterministically; no AI decides risk.

## Purpose

Define RiskApprovalService: record independent risk sign-off / rejection at promotion.

## Responsibilities

Record approval as an independent sign-off following the deterministic verdict; no AI approves; overrides never bypass controls; hold no logic.

## Relationships

Follows review; gates promotion to signal generation; independent of research/portfolio (RS-2).

## Dependencies

core_domain.shared (EntityId); standard library.

## Related Governance Documents

CLAUDE.md (RS-2, AI-3, HO-2/3, CP-5); Architecture V2 §5.7, §6.2; RB-13 · RISK; P2-09.
