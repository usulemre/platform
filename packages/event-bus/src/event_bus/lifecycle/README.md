# event-bus · lifecycle

> **Phase 3.3 Event Bus — vendor-independent event backbone, interfaces only.** Technology- and
> vendor-independent, composable, auditable. No messaging technology (Kafka/NATS/RabbitMQ), no queues,
> no brokers, no business logic, no infrastructure. Transports canonical domain events only; supports
> versioning, traceability, replay, and auditability.

## Purpose

Define EventLifecycle (CREATED/VALIDATED/PUBLISHED/ROUTED/DELIVERED/ACKNOWLEDGED/ARCHIVED + FAILED/DEAD_LETTER), the canonical transitions, and the lifecycle service (retry/replay/filtering/version-migration/dead-letter).

## Responsibilities

Enumerate the event lifecycle and legal transitions as data and expose lifecycle operations; replay re-publishes a new delivery; hold no infrastructure.

## Relationships

Consumed by dispatcher/validation; drives retry/replay/dead-letter.

## Dependencies

core (EventIdentifier); standard library.

## Related Governance Documents

CLAUDE.md (RE-1/2, CP-2/7); Architecture V2 §5.2, §5.10; RB-20 · CODE.
