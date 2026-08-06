# event-bus · metadata

> **Phase 3.3 Event Bus — vendor-independent event backbone, interfaces only.** Technology- and
> vendor-independent, composable, auditable. No messaging technology (Kafka/NATS/RabbitMQ), no queues,
> no brokers, no business logic, no infrastructure. Transports canonical domain events only; supports
> versioning, traceability, replay, and auditability.

## Purpose

Define EventMetadata (reusing the messaging MessageHeader): identity, correlation/causation, version, and owning context.

## Responsibilities

Carry immutable event metadata built on the messaging header; add schema version and source context; hold no logic.

## Relationships

Consumed by envelope; reuses platform_messaging.MessageHeader.

## Dependencies

platform_contracts.common (SchemaVersion); platform_messaging.metadata (MessageHeader).

## Related Governance Documents

CLAUDE.md (CP-7, CS-3, VER-1); Architecture V2 §5.10; RB-20 · CODE.
