# event-bus · governance

> **Phase 3.3 Event Bus — vendor-independent event backbone, interfaces only.** Technology- and
> vendor-independent, composable, auditable. No messaging technology (Kafka/NATS/RabbitMQ), no queues,
> no brokers, no business logic, no infrastructure. Transports canonical domain events only; supports
> versioning, traceability, replay, and auditability.

## Purpose

Define CanonicalEventEntry, the CANONICAL_EVENTS catalog (ResearchCreated, DatasetValidated, ExperimentRegistered, FeatureAccepted, BacktestCompleted, RiskApproved, SignalGenerated, PortfolioConstructed, ExecutionAuthorized, WorkflowCompleted), and the DomainEventGovernance interface.

## Responsibilities

Catalog the canonical domain events the bus transports (type, category, source context); govern register-before-publish; hold no logic.

## Relationships

References the domain events defined in their bounded contexts; consumed by registry/publisher.

## Dependencies

platform_messaging.event_model (EventCategory); standard library.

## Related Governance Documents

CLAUDE.md (AC-1, CP-7, VER-1); Architecture V2 §5.2, §5.5..§5.9, §5.10; Signal/Portfolio/Execution/Workflow registries.
