# research-service · events

> **Phase 2.1 Research Service — institutional research model, interfaces only.** Deterministic,
> technology-independent, immutable, auditable. No statistical algorithms, no backtesting, no AI,
> no persistence, no infrastructure, no API, no UI. It proposes and records; it never adjudicates.

## Purpose

Define the canonical research domain events: ResearchCreated, ResearchRegistered, ResearchStarted, ResearchUpdated, ResearchSubmittedForReview, ResearchValidated, ResearchApproved, ResearchArchived.

## Responsibilities

Represent research lifecycle facts as immutable domain events carrying the domain event envelope; ResearchValidated records a deterministic-engine outcome, it does not assert it.

## Relationships

Published to the bus/audit; align with core_domain.research events.

## Dependencies

core_domain.shared (DomainEvent, EntityId).

## Related Governance Documents

CLAUDE.md (CP-2/7, CP-5); Architecture V2 §5.5, §5.10; RB-02 · RMET.
