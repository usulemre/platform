# scheduler · metadata

> **Phase 3.4 Scheduler Framework — deterministic scheduling abstractions, interfaces only.**
> Deterministic, technology- and vendor-independent, composable, auditable. No cron parsing, no timers,
> no distributed scheduling, no business logic, no infrastructure. Supports dependency-aware
> scheduling, auditability, and replay.

## Purpose

Define SchedulerMetadata: the immutable, auditable metadata of a scheduled job.

## Responsibilities

Carry scheduler metadata (identity, category, owner, status, tags) as data; hold no logic.

## Relationships

core (ScheduleIdentifier, JobCategory); lifecycle (JobStatus); consumed by monitoring/registry.

## Dependencies

core (ScheduleIdentifier, JobCategory); lifecycle (JobStatus).

## Related Governance Documents

CLAUDE.md (CP-7, OB-1); Architecture V2 §5.4; RB-20 · CODE.
