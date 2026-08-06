# signal-service · approval

> **Phase 2.7 Signal Engine — deterministic decision layer, interfaces only.** Deterministic,
> immutable, auditable, traceable. No signal-generation algorithms, no ranking algorithms, no scoring
> formulas, no ML, no portfolio construction, no execution authority, no broker, no persistence, no
> infrastructure, no API. It decides deterministically; it never constructs portfolios or executes.

## Purpose

Define SignalApproval and SignalApprovalService: approval requiring validation AND a mandatory Risk approval.

## Responsibilities

Record approval only when validated and holding an approved Risk assessment (RS-1); no AI approves; hold no logic.

## Relationships

core_domain.shared (EntityId, Ref); requires an approved Risk assessment from the Risk Engine.

## Dependencies

Consumed by lifecycle/management; gates activation.

## Related Governance Documents

CLAUDE.md (RS-1, AI-3, PS-1, HO-2); Architecture V2 §5.5, §5.7, §6.3; RB-13 · RISK; RB-09/10 · FAR.
