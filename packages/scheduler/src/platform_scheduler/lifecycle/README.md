# scheduler · lifecycle

> **Phase 3.4 Scheduler Framework — deterministic scheduling abstractions, interfaces only.**
> Deterministic, technology- and vendor-independent, composable, auditable. No cron parsing, no timers,
> no distributed scheduling, no business logic, no infrastructure. Supports dependency-aware
> scheduling, auditability, and replay.

## Purpose

Define JobLifecycle (REGISTERED/SCHEDULED/READY/RUNNING/COMPLETED/FAILED/RETRYING/ARCHIVED + PAUSED/CANCELLED), the canonical transitions, JobStatus, and the lifecycle service (pause/resume/cancel/retry/recover).

## Responsibilities

Enumerate the job lifecycle and legal transitions as data and expose lifecycle operations; replay re-runs as a new scheduled run; hold no infrastructure or timers.

## Relationships

Consumed by core, metadata, monitoring, policies.

## Dependencies

platform_contracts.common (Id); standard library.

## Related Governance Documents

CLAUDE.md (WCON-1, RE-1, CS-3, RL-1); Architecture V2 §5.4; RB-20 · CODE; Workflow Contracts.
