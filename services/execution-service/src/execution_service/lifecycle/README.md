# execution-service · lifecycle

> **Phase 2.9 Execution Engine — deterministic planning/authorization, interfaces only.** Deterministic,
> production-safe, immutable, auditable. Produces execution PLANS only. No broker integration, no
> exchange connectivity, no order routing, no market connectivity, no FIX, no REST clients, no
> persistence, no infrastructure, no API. It plans and authorizes deterministically; it never submits
> production orders and never talks to brokers/exchanges.

## Purpose

Define ExecutionLifecycle (REQUESTED/PLANNED/VALIDATING/AUTHORIZED/READY/COMPLETED/ARCHIVED + REJECTED/CANCELLED), the canonical transitions (reauthorization/cancellation/rescheduling/replay/recovery), and the lifecycle-service interface.

## Responsibilities

Enumerate the lifecycle and legal transitions as data; AUTHORIZED requires a valid token + risk + parity; replay creates new lineage (RL-1); hold no logic.

## Relationships

Consumed by model, status, authorization, scheduling, management, policies.

## Dependencies

core_domain.shared (EntityId); standard library.

## Related Governance Documents

CLAUDE.md (RS-4, DEP-1, AI-1, RL-1); Architecture V2 §5.9, §7.2; RB-14 · EXEC; Execution Governance.
