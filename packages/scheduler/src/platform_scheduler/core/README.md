# scheduler · core

> **Phase 3.4 Scheduler Framework — deterministic scheduling abstractions, interfaces only.**
> Deterministic, technology- and vendor-independent, composable, auditable. No cron parsing, no timers,
> no distributed scheduling, no business logic, no infrastructure. Supports dependency-aware
> scheduling, auditability, and replay.

## Purpose

Define JobCategory (11 categories), ScheduleIdentifier, SchedulerContext, and the ScheduledJob model.

## Responsibilities

Provide the canonical job identity/category/context and the ScheduledJob (which references its work by identity); hold no business logic or timers.

## Relationships

Consumed by every Scheduler module; jobs reference services/workflows/engines by identity.

## Dependencies

platform_contracts.common (CorrelationId, SchemaVersion); lifecycle (JobStatus).

## Related Governance Documents

CLAUDE.md (DE-1, CS-3, SE-2, NM-2); Architecture V2 §5.2, §5.4; RB-20 · CODE; Workflow Contracts.
