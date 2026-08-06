# execution-service · planning

> **Phase 2.9 Execution Engine — deterministic planning/authorization, interfaces only.** Deterministic,
> production-safe, immutable, auditable. Produces execution PLANS only. No broker integration, no
> exchange connectivity, no order routing, no market connectivity, no FIX, no REST clients, no
> persistence, no infrastructure, no API. It plans and authorizes deterministically; it never submits
> production orders and never talks to brokers/exchanges.

## Purpose

Define ExecutionPlan, ExecutionInstruction, and ExecutionPlanningService: the execution plan/instruction model and planning interface (plans only).

## Responsibilities

Transform an approved portfolio into a deterministic plan of instructions (planned deltas, not orders); produce plans only; never route/submit/connect; hold no logic.

## Relationships

core_domain.execution (ExecutionMode); core_domain.shared (EntityId, Ref); consumes an approved Portfolio by identity.

## Dependencies

Consumed by validation/authorization/management.

## Related Governance Documents

CLAUDE.md (DEP-1/3, PS-1, DE-1); Architecture V2 §5.9, §6.3; RB-14 · EXEC; Execution Governance.
