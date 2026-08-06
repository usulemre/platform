# scheduler · errors

> **Phase 3.4 Scheduler Framework — deterministic scheduling abstractions, interfaces only.**
> Deterministic, technology- and vendor-independent, composable, auditable. No cron parsing, no timers,
> no distributed scheduling, no business logic, no infrastructure. Supports dependency-aware
> scheduling, auditability, and replay.

## Purpose

Define SchedulerError, SchedulerErrorKind, and SchedulerFrameworkError: the canonical, vendor-neutral error model.

## Responsibilities

Express scheduler errors in vendor-neutral terms (unregistered/dependency/cyclic/window/max-retries/transition/non-deterministic); leak no infrastructure details; hold no logic.

## Relationships

Used across the Scheduler modules.

## Dependencies

Standard library only.

## Related Governance Documents

CLAUDE.md (DE-1, WCON-1, RE-1, CP-7); Architecture V2 §5.4; RB-20 · CODE.
