# scheduler · window

> **Phase 3.4 Scheduler Framework — deterministic scheduling abstractions, interfaces only.**
> Deterministic, technology- and vendor-independent, composable, auditable. No cron parsing, no timers,
> no distributed scheduling, no business logic, no infrastructure. Supports dependency-aware
> scheduling, auditability, and replay.

## Purpose

Define ExecutionWindow: the canonical execution window with supplied ISO-8601 boundaries.

## Responsibilities

Represent execution windows as immutable, supplied data; hold no wall-clock reads or timers.

## Relationships

Consumed by schedule_registry and planner; drives ExecutionWindowOpened/Closed events.

## Dependencies

Standard library only.

## Related Governance Documents

CLAUDE.md (DE-1, CS-3); Architecture V2 §5.4; RB-20 · CODE.
