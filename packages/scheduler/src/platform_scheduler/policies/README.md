# scheduler · policies

> **Phase 3.4 Scheduler Framework — deterministic scheduling abstractions, interfaces only.**
> Deterministic, technology- and vendor-independent, composable, auditable. No cron parsing, no timers,
> no distributed scheduling, no business logic, no infrastructure. Supports dependency-aware
> scheduling, auditability, and replay.

## Purpose

Define SchedulePolicy (versioned) and the governance policy interfaces: DeterministicSchedulingPolicy, DependencyAwarePolicy, RegisterBeforeSchedulePolicy, NoDistributedSchedulingPolicy.

## Responsibilities

Express the scheduling governance rules (deterministic, dependency-aware, register-before-schedule, no distributed scheduling) as interfaces; hold no logic.

## Relationships

Enforced by deterministic components; consumed by planner/lifecycle.

## Dependencies

platform_contracts.common (Id, SchemaVersion); standard library.

## Related Governance Documents

CLAUDE.md (DE-1, CS-3, WCON-1); Architecture V2 §5.4; RB-20 · CODE.
