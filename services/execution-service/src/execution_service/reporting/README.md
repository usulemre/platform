# execution-service · reporting

> **Phase 2.9 Execution Engine — deterministic planning/authorization, interfaces only.** Deterministic,
> production-safe, immutable, auditable. Produces execution PLANS only. No broker integration, no
> exchange connectivity, no order routing, no market connectivity, no FIX, no REST clients, no
> persistence, no infrastructure, no API. It plans and authorizes deterministically; it never submits
> production orders and never talks to brokers/exchanges.

## Purpose

Define ExecutionReport and ExecutionReportingService: the immutable, explainable execution report and its generation.

## Responsibilities

Aggregate the summary and references to TCA/parity/reconciliation into an explainable report; compute no statistics; hold no logic.

## Relationships

core_domain.shared (EntityId, Ref); model (ExecutionSummary).

## Dependencies

Consumed by governance/monitoring/management.

## Related Governance Documents

CLAUDE.md (EXP-2, CP-7, OB-2); Architecture V2 §5.9; RB-14 · EXEC.
