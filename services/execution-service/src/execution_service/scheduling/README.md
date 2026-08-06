# execution-service · scheduling

> **Phase 2.9 Execution Engine — deterministic planning/authorization, interfaces only.** Deterministic,
> production-safe, immutable, auditable. Produces execution PLANS only. No broker integration, no
> exchange connectivity, no order routing, no market connectivity, no FIX, no REST clients, no
> persistence, no infrastructure, no API. It plans and authorizes deterministically; it never submits
> production orders and never talks to brokers/exchanges.

## Purpose

Define ExecutionSchedule and ExecutionSchedulingService: the execution window model and scheduling/rescheduling interface.

## Responsibilities

Represent execution windows as immutable data and schedule/reschedule authorized plans deterministically; no wall-clock reads; hold no infra or logic.

## Relationships

Consumed by management; schedules authorized plans; live remains token-gated (RS-4).

## Dependencies

core_domain.shared (EntityId); standard library.

## Related Governance Documents

CLAUDE.md (DEP-1, RS-4, CS-3); Architecture V2 §5.9; RB-14 · EXEC; Execution Governance.
