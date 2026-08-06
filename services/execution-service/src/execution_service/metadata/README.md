# execution-service · metadata

> **Phase 2.9 Execution Engine — deterministic planning/authorization, interfaces only.** Deterministic,
> production-safe, immutable, auditable. Produces execution PLANS only. No broker integration, no
> exchange connectivity, no order routing, no market connectivity, no FIX, no REST clients, no
> persistence, no infrastructure, no API. It plans and authorizes deterministically; it never submits
> production orders and never talks to brokers/exchanges.

## Purpose

Define ExecutionMetadata: the immutable, auditable, provenance-bearing metadata of an execution.

## Responsibilities

Carry execution metadata (identity, description, owner, status, summary, provenance, tags) as data; hold no logic.

## Relationships

Consumed by management and repositories.

## Dependencies

core_domain.shared (Provenance); model; status.

## Related Governance Documents

CLAUDE.md (CP-7, OB-1); Architecture V2 §5.9; RB-14 · EXEC.
