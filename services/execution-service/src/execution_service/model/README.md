# execution-service · model

> **Phase 2.9 Execution Engine — deterministic planning/authorization, interfaces only.** Deterministic,
> production-safe, immutable, auditable. Produces execution PLANS only. No broker integration, no
> exchange connectivity, no order routing, no market connectivity, no FIX, no REST clients, no
> persistence, no infrastructure, no API. It plans and authorizes deterministically; it never submits
> production orders and never talks to brokers/exchanges.

## Purpose

Define the canonical execution models: Execution (aggregate), ExecutionIdentifier, ExecutionEvidence, ExecutionDecision, ExecutionSummary.

## Responsibilities

Represent an execution as an immutable, manifest-bearing aggregate that binds approved portfolio/risk/parity evidence by identity and produces plans only; hold no broker/exchange/order logic and no AI decision.

## Relationships

Consumed by every Execution Engine module; references Portfolio/Risk/parity by identity; reuses the reproducibility spine.

## Dependencies

core_domain.shared (AggregateRoot, Provenance, Ref, RunManifestRef, Version); status.

## Related Governance Documents

CLAUDE.md (DEP-1/3, RS-4, PS-1, CP-2/5/7, RP-1, AI-1, NM-2); Architecture V2 §5.9, §6.3; RB-14 · EXEC; P3-15.
