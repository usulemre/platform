# event-bus · core

> **Phase 3.3 Event Bus — vendor-independent event backbone, interfaces only.** Technology- and
> vendor-independent, composable, auditable. No messaging technology (Kafka/NATS/RabbitMQ), no queues,
> no brokers, no business logic, no infrastructure. Transports canonical domain events only; supports
> versioning, traceability, replay, and auditability.

## Purpose

Define EventIdentifier, EventTopic (partitioned + restriction-aware), EventContext, and re-export the canonical DomainEvent transported by the bus.

## Responsibilities

Provide the canonical event identity/topic/context and the transported domain-event type; encode isolation-awareness via restricted topics; hold no logic.

## Relationships

Consumed by every Event Bus module; transports core_domain domain events; topics map to P5-04 partitions/ACLs.

## Dependencies

core_domain.shared (DomainEvent); platform_contracts.common (CorrelationId); platform_messaging.event_model (EventCategory).

## Related Governance Documents

CLAUDE.md (AC-1/3, CP-7, SC-3); Architecture V2 §5.2, §5.10, §6.1; P5-04, P2-07; TDR §14.
