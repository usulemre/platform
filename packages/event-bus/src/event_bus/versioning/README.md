# event-bus · versioning

> **Phase 3.3 Event Bus — vendor-independent event backbone, interfaces only.** Technology- and
> vendor-independent, composable, auditable. No messaging technology (Kafka/NATS/RabbitMQ), no queues,
> no brokers, no business logic, no infrastructure. Transports canonical domain events only; supports
> versioning, traceability, replay, and auditability.

## Purpose

Define EventVersion and EventVersionMigration and re-export the messaging Compatibility/EventSchema/SchemaRegistry.

## Responsibilities

Govern event schema versioning and version migration so historical events remain interpretable; hold no logic.

## Relationships

Reuses platform_messaging.versioning; consumed by registry/validation.

## Dependencies

platform_contracts.common (SchemaVersion); platform_messaging.versioning (Compatibility, EventSchema, SchemaRegistry).

## Related Governance Documents

CLAUDE.md (VER-1/2, DEPR-1..3); Architecture V2 §5.10; RB-20 · CODE; TDR §14.
