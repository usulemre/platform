# scheduler · trigger

> **Phase 3.4 Scheduler Framework — deterministic scheduling abstractions, interfaces only.**
> Deterministic, technology- and vendor-independent, composable, auditable. No cron parsing, no timers,
> no distributed scheduling, no business logic, no infrastructure. Supports dependency-aware
> scheduling, auditability, and replay.

## Purpose

Define Trigger and TriggerKind (time/event/dependency/manual): the canonical, declarative trigger with an opaque expression.

## Responsibilities

Represent triggers declaratively; hold an opaque schedule expression (never cron-parsed here); hold no timer or parsing logic.

## Relationships

Consumed by schedule_registry and planner; EVENT triggers reference Event Bus domain events.

## Dependencies

Standard library only.

## Related Governance Documents

CLAUDE.md (DE-1, CS-3, AC-1); Architecture V2 §5.2, §5.4; RB-20 · CODE; Event Bus.
