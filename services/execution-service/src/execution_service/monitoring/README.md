# execution-service · monitoring

> **Phase 2.9 Execution Engine — deterministic planning/authorization, interfaces only.** Deterministic,
> production-safe, immutable, auditable. Produces execution PLANS only. No broker integration, no
> exchange connectivity, no order routing, no market connectivity, no FIX, no REST clients, no
> persistence, no infrastructure, no API. It plans and authorizes deterministically; it never submits
> production orders and never talks to brokers/exchanges.

## Purpose

Define ExecutionMonitor: interfaces to surface execution status/fills/parity for independent monitoring.

## Responsibilities

Surface execution metrics for independent monitoring (narrate only); never decide a halt; hold no infra or logic.

## Relationships

core_domain.execution (Fill, ParityReport); core_domain.shared (EntityId).

## Dependencies

Feeds the Production Monitoring layer; the kill-switch (human/risk) forces HALT.

## Related Governance Documents

CLAUDE.md (RS-3, OB-1/3, EXP-3); Architecture V2 §5.9, §5.7; RB-14 · EXEC; Production Monitoring Governance.
