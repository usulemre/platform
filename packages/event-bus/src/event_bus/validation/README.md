# event-bus · validation

> **Phase 3.3 Event Bus — vendor-independent event backbone, interfaces only.** Technology- and
> vendor-independent, composable, auditable. No messaging technology (Kafka/NATS/RabbitMQ), no queues,
> no brokers, no business logic, no infrastructure. Transports canonical domain events only; supports
> versioning, traceability, replay, and auditability.

## Purpose

Define the EventValidator interface (reusing the structural ValidationResult): structural validation of an event envelope before publish.

## Responsibilities

Validate event structure (registered type, schema, header, domain-event) before publish; never statistical; hold no logic.

## Relationships

Reuses platform_messaging.validation; consumes envelopes; gates the CREATED->VALIDATED transition.

## Dependencies

platform_messaging.validation (ValidationResult); envelope (EventEnvelope).

## Related Governance Documents

CLAUDE.md (AI-2, DE-4, VER-1); Architecture V2 §5.10; RB-20 · CODE.
