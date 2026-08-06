# scheduler · retry

> **Phase 3.4 Scheduler Framework — deterministic scheduling abstractions, interfaces only.**
> Deterministic, technology- and vendor-independent, composable, auditable. No cron parsing, no timers,
> no distributed scheduling, no business logic, no infrastructure. Supports dependency-aware
> scheduling, auditability, and replay.

## Purpose

Define RetryPolicy and BackoffStrategy: retry/backoff for jobs as immutable configuration values.

## Responsibilities

Express retry semantics as declarative data; the concrete scheduler applies them; hold no timers or logic.

## Relationships

Consumed by schedule_registry and lifecycle (retry).

## Dependencies

Standard library only.

## Related Governance Documents

CLAUDE.md (RE-1, CS-3); Architecture V2 §5.4; RB-20 · CODE.
