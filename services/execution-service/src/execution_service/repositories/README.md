# execution-service · repositories

> **Phase 2.9 Execution Engine — deterministic planning/authorization, interfaces only.** Deterministic,
> production-safe, immutable, auditable. Produces execution PLANS only. No broker integration, no
> exchange connectivity, no order routing, no market connectivity, no FIX, no REST clients, no
> persistence, no infrastructure, no API. It plans and authorizes deterministically; it never submits
> production orders and never talks to brokers/exchanges.

## Purpose

Define the Execution Engine repository interfaces: ExecutionRepositoryContract (append-only), ExecutionPlanRepository, ExecutionSessionRepository.

## Responsibilities

Express append-only, immutable retrieval of executions, plans, and sessions as interfaces; hold no persistence.

## Relationships

Consumed by management; complements core_domain.execution repositories.

## Dependencies

core_domain.shared (EntityId); model; planning; session.

## Related Governance Documents

CLAUDE.md (CP-2, OB-1, RP-4); Architecture V2 §5.9; RB-14 · EXEC.
