# event-bus · retry

> **Phase 3.3 Event Bus — vendor-independent event backbone, interfaces only.** Technology- and
> vendor-independent, composable, auditable. No messaging technology (Kafka/NATS/RabbitMQ), no queues,
> no brokers, no business logic, no infrastructure. Transports canonical domain events only; supports
> versioning, traceability, replay, and auditability.

## Purpose

Re-export the messaging RetryPolicy and BackoffStrategy: declarative retry configuration for event delivery.

## Responsibilities

Express retry semantics as declarative data (reused from the messaging foundation); the concrete bus applies them; hold no timers or logic.

## Relationships

Reuses platform_messaging.retry; consumed by dispatcher and dead_letter.

## Dependencies

platform_messaging.retry (RetryPolicy, BackoffStrategy).

## Related Governance Documents

CLAUDE.md (RE-1, CS-3); Architecture V2 §5.10; TDR §14.
