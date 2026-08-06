# execution-service · events

> **Phase 2.9 Execution Engine — deterministic planning/authorization, interfaces only.** Deterministic,
> production-safe, immutable, auditable. Produces execution PLANS only. No broker integration, no
> exchange connectivity, no order routing, no market connectivity, no FIX, no REST clients, no
> persistence, no infrastructure, no API. It plans and authorizes deterministically; it never submits
> production orders and never talks to brokers/exchanges.

## Purpose

Define the canonical execution domain events: ExecutionRequested, ExecutionPlanned, ExecutionValidated, ExecutionAuthorized, ExecutionRejected, ExecutionPrepared, ExecutionCompleted, ExecutionCancelled, ExecutionArchived.

## Responsibilities

Represent execution lifecycle facts as immutable domain events; ExecutionAuthorized records a token-gated authorization.

## Relationships

core_domain.shared (DomainEvent, EntityId); align with core_domain.execution events.

## Dependencies

Published to the bus/audit.

## Related Governance Documents

CLAUDE.md (CP-2/7, RS-4); Architecture V2 §5.9, §5.10; RB-14 · EXEC; Execution Governance.
