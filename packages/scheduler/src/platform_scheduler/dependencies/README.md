# scheduler · dependencies

> **Phase 3.4 Scheduler Framework — deterministic scheduling abstractions, interfaces only.**
> Deterministic, technology- and vendor-independent, composable, auditable. No cron parsing, no timers,
> no distributed scheduling, no business logic, no infrastructure. Supports dependency-aware
> scheduling, auditability, and replay.

## Purpose

Define JobDependency, DependencyKind, and the DependencyScheduler interface: dependency-aware scheduling.

## Responsibilities

Represent job dependencies by identity and expose deterministic readiness resolution; a job runs only after its dependencies are satisfied; hold no algorithm.

## Relationships

Consumed by planner and lifecycle; dependencies reference upstream jobs/data/approvals by identity.

## Dependencies

platform_contracts.common (Id); standard library.

## Related Governance Documents

CLAUDE.md (DE-1, SE-2, WCON-1); Architecture V2 §5.4; RB-20 · CODE; Workflow Contracts.
