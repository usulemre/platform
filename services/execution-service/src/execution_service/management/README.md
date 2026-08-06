# execution-service · management

> **Phase 2.9 Execution Engine — deterministic planning/authorization, interfaces only.** Deterministic,
> production-safe, immutable, auditable. Produces execution PLANS only. No broker integration, no
> exchange connectivity, no order routing, no market connectivity, no FIX, no REST clients, no
> persistence, no infrastructure, no API. It plans and authorizes deterministically; it never submits
> production orders and never talks to brokers/exchanges.

## Purpose

Define the Execution Engine service interfaces: ExecutionService (lifecycle), ExecutionEngineService (deterministic decision gate), ExecutionCatalogService.

## Responsibilities

Orchestrate the execution lifecycle and gate authorization on validation + parity + risk + a valid token; produce plans only; hold no execution authority beyond authorization and no AI decision.

## Relationships

Top-level module: composes model, planning, authorization, validation/governance, scheduling, session.

## Dependencies

core_domain.shared (EntityId); model; metadata.

## Related Governance Documents

CLAUDE.md (DEP-1, RS-4, AI-1, DE-1, PS-1); Architecture V2 §5.9, §6.3; RB-14 · EXEC; RB-13 · RISK; Execution Governance.
