# signal-service · events

> **Phase 2.7 Signal Engine — deterministic decision layer, interfaces only.** Deterministic,
> immutable, auditable, traceable. No signal-generation algorithms, no ranking algorithms, no scoring
> formulas, no ML, no portfolio construction, no execution authority, no broker, no persistence, no
> infrastructure, no API. It decides deterministically; it never constructs portfolios or executes.

## Purpose

Define the canonical signal domain events: SignalGenerated, SignalValidated, SignalApproved, SignalRejected, SignalActivated, SignalSuperseded, SignalRetired, SignalScoreUpdated, SignalRegistryUpdated.

## Responsibilities

Represent signal lifecycle facts as immutable domain events; SignalValidated records a deterministic-engine outcome.

## Relationships

core_domain.shared (DomainEvent, EntityId); align with core_domain.signal events.

## Dependencies

Published to the bus/audit.

## Related Governance Documents

CLAUDE.md (CP-2/7, RS-1); Architecture V2 §5.5, §5.10; RB-09/10 · FAR; Signal Registry.
