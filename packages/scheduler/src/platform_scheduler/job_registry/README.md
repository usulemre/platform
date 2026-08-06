# scheduler · job_registry

> **Phase 3.4 Scheduler Framework — deterministic scheduling abstractions, interfaces only.**
> Deterministic, technology- and vendor-independent, composable, auditable. No cron parsing, no timers,
> no distributed scheduling, no business logic, no infrastructure. Supports dependency-aware
> scheduling, auditability, and replay.

## Purpose

Define JobRegistry: the register-before-schedule registry of jobs.

## Responsibilities

Express register-before-schedule registration and retrieval of jobs as an interface; append-only; hold no persistence.

## Relationships

Consumed by planner/schedule_registry; complements the schedule registry.

## Dependencies

platform_contracts.common (Id); core (ScheduledJob); standard library.

## Related Governance Documents

CLAUDE.md (CP-7, DE-1); Architecture V2 §5.4; RB-20 · CODE.
