# messaging · retry

> **Phase 1.4 Event & Messaging Foundation — abstractions only.** Technology-independent,
> deterministic, immutable, traceable. No broker, no transport, no serialization, no persistence,
> no business logic. Interfaces are placeholders.

## Purpose

Define RetryPolicy: max attempts, backoff strategy, and base delay as immutable configuration values.

## Responsibilities

Express retry semantics as declarative data; the concrete bus/consumer applies them; no timers or clock reads here.

## Dependencies

Standard library only.

## Relationships

Used with delivery and dead_letter policies.

## Related Governance Documents

CLAUDE.md (RE-1, CS-3); Architecture V2 §5.10, §10.
