# portfolio-service · approval

> **Phase 2.8 Portfolio Engine — deterministic construction layer, interfaces only.** Deterministic,
> reproducible, immutable, auditable. No optimization algorithms, no allocation mathematics, no trade
> execution, no order management, no broker/market connectivity, no persistence, no infrastructure, no
> API. It constructs governed candidates deterministically; it never executes.

## Purpose

Define PortfolioApproval and PortfolioApprovalService: approval requiring validation, independent risk review, and human counter-sign.

## Responsibilities

Record approval only when validated and independently risk-reviewed; require human counter-sign for capital; no AI approves; hold no logic.

## Relationships

core_domain.shared (EntityId, Ref); requires independent risk review from the Risk Engine.

## Dependencies

Consumed by lifecycle/management; gates READY_FOR_EXECUTION.

## Related Governance Documents

CLAUDE.md (RS-2, HO-2, AI-3, PS-1); Architecture V2 §5.6, §5.7, §6.2; RB-12 · PORT; RB-13 · RISK.
