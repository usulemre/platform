# scheduler · events

> **Phase 3.4 Scheduler Framework — deterministic scheduling abstractions, interfaces only.**
> Deterministic, technology- and vendor-independent, composable, auditable. No cron parsing, no timers,
> no distributed scheduling, no business logic, no infrastructure. Supports dependency-aware
> scheduling, auditability, and replay.

## Purpose

Define the canonical scheduler domain events: JobRegistered, JobScheduled, JobStarted, JobCompleted, JobFailed, JobRetried, JobCancelled, ScheduleUpdated, ExecutionWindowOpened, ExecutionWindowClosed.

## Responsibilities

Represent scheduler lifecycle facts as immutable domain events carrying the domain event envelope; records, not commands.

## Relationships

core_domain.shared (DomainEvent, EntityId); flow on the Event Bus.

## Dependencies

core_domain.shared (DomainEvent, EntityId).

## Related Governance Documents

CLAUDE.md (CP-2/7, AC-1); Architecture V2 §5.4, §5.10; RB-20 · CODE; Event Bus.
