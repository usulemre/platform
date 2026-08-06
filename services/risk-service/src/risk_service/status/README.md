# risk-service · status

> **Phase 2.6 Risk Engine — deterministic governance layer, interfaces only.** Deterministic,
> independent, immutable, auditable, governance-compliant. No numerical risk algorithms, no VaR/stress
> calculations, no execution authority, no broker integration, no persistence, no infrastructure, no
> API. It evaluates and decides deterministically; no AI decides risk.

## Purpose

Define RiskStatus: the current lifecycle state plus the supplied time it was entered.

## Responsibilities

Represent risk-assessment status as an immutable value object; hold no logic.

## Relationships

Consumed by model and metadata.

## Dependencies

lifecycle (RiskLifecycle); standard library.

## Related Governance Documents

CLAUDE.md (CP-2/7, CS-3); Architecture V2 §5.7; RB-13 · RISK.
