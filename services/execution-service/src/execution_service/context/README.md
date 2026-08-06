# execution-service · context

> **Phase 2.9 Execution Engine — deterministic planning/authorization, interfaces only.** Deterministic,
> production-safe, immutable, auditable. Produces execution PLANS only. No broker integration, no
> exchange connectivity, no order routing, no market connectivity, no FIX, no REST clients, no
> persistence, no infrastructure, no API. It plans and authorizes deterministically; it never submits
> production orders and never talks to brokers/exchanges.

## Purpose

Define ExecutionContext: the immutable, deterministic execution context (injected clock as-of, mode, adapter reference).

## Responsibilities

Carry the injected-clock boundary, execution mode (paper default), and the out-of-scope adapter reference by value; the engine never calls the adapter; hold no logic and no infra.

## Relationships

Consumed by planning, session, management; reuses core ExecutionMode.

## Dependencies

core_domain.execution (ExecutionMode); core_domain.shared (AsOf); standard library.

## Related Governance Documents

CLAUDE.md (DEP-1, PIT-4, CS-3, AV2-23); Architecture V2 §5.9, §2.1; RB-14 · EXEC.
