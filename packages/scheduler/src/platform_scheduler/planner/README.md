# scheduler · planner

> **Phase 3.4 Scheduler Framework — deterministic scheduling abstractions, interfaces only.**
> Deterministic, technology- and vendor-independent, composable, auditable. No cron parsing, no timers,
> no distributed scheduling, no business logic, no infrastructure. Supports dependency-aware
> scheduling, auditability, and replay.

## Purpose

Define ExecutionPlan, ExecutionPlanEntry, and the ExecutionPlanner interface: deterministic, dependency-aware execution planning.

## Responsibilities

Represent an execution plan as immutable, dependency-ordered data and expose deterministic, reproducible planning; hold no scheduling algorithm or timers.

## Relationships

core (SchedulerContext); consumes dependencies and windows; produces a plan for the concrete scheduler.

## Dependencies

platform_contracts.common (Id); core (SchedulerContext); standard library.

## Related Governance Documents

CLAUDE.md (DE-1, RP-1, WCON-1); Architecture V2 §5.2, §5.4; RB-20 · CODE.
