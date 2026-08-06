# execution-service · session

> **Phase 2.9 Execution Engine — deterministic planning/authorization, interfaces only.** Deterministic,
> production-safe, immutable, auditable. Produces execution PLANS only. No broker integration, no
> exchange connectivity, no order routing, no market connectivity, no FIX, no REST clients, no
> persistence, no infrastructure, no API. It plans and authorizes deterministically; it never submits
> production orders and never talks to brokers/exchanges.

## Purpose

Define ExecutionSession and ExecutionSessionService: an immutable session record and its open/close interface (paper default).

## Responsibilities

Bind an execution run's context to a Run Manifest as an immutable session; paper/shadow by default; never submit orders or connect to brokers; hold no logic.

## Relationships

core_domain.execution (ExecutionMode); core_domain.shared (EntityId, RunManifestRef); context.

## Dependencies

Consumed by management; complements monitoring/reporting.

## Related Governance Documents

CLAUDE.md (DEP-1, CP-2, RP-1, OB-1); Architecture V2 §5.9; RB-14 · EXEC.
