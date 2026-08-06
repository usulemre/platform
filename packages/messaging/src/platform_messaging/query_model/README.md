# messaging · query_model

> **Phase 1.4 Event & Messaging Foundation — abstractions only.** Technology-independent,
> deterministic, immutable, traceable. No broker, no transport, no serialization, no persistence,
> no business logic. Interfaces are placeholders.

## Purpose

Define the query messaging model: the Query payload base (re-exported), QueryMessage envelope, and the QueryHandler interface.

## Responsibilities

Represent read requests as messages; historical reads carry an as-of (PIT-1); hold no logic.

## Dependencies

platform_contracts.common (Query, Response); metadata; standard library.

## Relationships

Consumed by routing; targets read models / the As-Of Gateway.

## Related Governance Documents

CLAUDE.md (PIT-1); Architecture V2 §5.10, §6.4; RB-08 · PIT.
