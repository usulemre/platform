# scheduler · monitoring

> **Phase 3.4 Scheduler Framework — deterministic scheduling abstractions, interfaces only.**
> Deterministic, technology- and vendor-independent, composable, auditable. No cron parsing, no timers,
> no distributed scheduling, no business logic, no infrastructure. Supports dependency-aware
> scheduling, auditability, and replay.

## Purpose

Define JobHealth, JobRunStatus, and the JobMonitor interface: job run monitoring.

## Responsibilities

Represent job run health as immutable data and expose a monitor interface that narrates only; hold no infrastructure or decision logic.

## Relationships

platform_contracts.common (Id); feeds Production Monitoring; drives DELAYED/STUCK detection.

## Dependencies

platform_contracts.common (Id); standard library.

## Related Governance Documents

CLAUDE.md (OB-1/3, EXP-3); Architecture V2 §5.4, §5.10; RB-20 · CODE; Production Monitoring Governance.
