# scheduler · schedule_registry

> **Phase 3.4 Scheduler Framework — deterministic scheduling abstractions, interfaces only.**
> Deterministic, technology- and vendor-independent, composable, auditable. No cron parsing, no timers,
> no distributed scheduling, no business logic, no infrastructure. Supports dependency-aware
> scheduling, auditability, and replay.

## Purpose

Define Schedule and the SchedulerRegistry interface: the schedule model (job + trigger + window + retry) and its register-before-use registry.

## Responsibilities

Represent schedules as immutable, versioned bindings and expose register-before-use registration; append-only; hold no persistence.

## Relationships

Consumed by planner and monitoring; binds jobs (core), triggers, windows, and retry policies.

## Dependencies

platform_contracts.common (Id); core (ScheduleIdentifier); trigger (Trigger); window (ExecutionWindow); retry (RetryPolicy).

## Related Governance Documents

CLAUDE.md (CP-2/7, VER-1/2); Architecture V2 §5.4; RB-20 · CODE; Workflow Contracts.
