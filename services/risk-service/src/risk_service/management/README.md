# risk-service · management

> **Phase 2.6 Risk Engine — deterministic governance layer, interfaces only.** Deterministic,
> independent, immutable, auditable, governance-compliant. No numerical risk algorithms, no VaR/stress
> calculations, no execution authority, no broker integration, no persistence, no infrastructure, no
> API. It evaluates and decides deterministically; no AI decides risk.

## Purpose

Define the Risk Engine service interfaces: RiskService (lifecycle), RiskEngineService (the deterministic gate), RiskCatalogService.

## Responsibilities

Orchestrate the risk lifecycle and gate research outputs before signal generation deterministically; hold no execution authority, no numerical logic, no AI decision.

## Relationships

Top-level module: composes model, pipeline, assessment, validation/review/approval; gates signal generation.

## Dependencies

core_domain.shared (EntityId); model; metadata.

## Related Governance Documents

CLAUDE.md (RS-1/2, AI-1, DE-1, CP-5); Architecture V2 §5.7, §6.3; RB-13 · RISK; P1-03, P2-09.
