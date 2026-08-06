# execution-service · constraints

> **Phase 2.9 Execution Engine — deterministic planning/authorization, interfaces only.** Deterministic,
> production-safe, immutable, auditable. Produces execution PLANS only. No broker integration, no
> exchange connectivity, no order routing, no market connectivity, no FIX, no REST clients, no
> persistence, no infrastructure, no API. It plans and authorizes deterministically; it never submits
> production orders and never talks to brokers/exchanges.

## Purpose

Define ExecutionConstraint, ExecutionConstraintKind, and ExecutionConstraintService: deterministic execution-governance constraints (participation/venue/order-size/risk/mandate).

## Responsibilities

Represent execution constraints as immutable data with a management interface; include mandatory risk constraints from the Risk Engine; hold no routing or mathematics.

## Relationships

Consumed by planning, validation, governance; risk constraints reference the Risk Engine by identity.

## Dependencies

core_domain.shared (EntityId, Ref); standard library.

## Related Governance Documents

CLAUDE.md (RS-1, DE-1, DEP-1); Architecture V2 §5.9, §5.7; RB-14 · EXEC; RB-13 · RISK.
