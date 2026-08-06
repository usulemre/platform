# research-service · lifecycle

> **Phase 2.1 Research Service — institutional research model, interfaces only.** Deterministic,
> technology-independent, immutable, auditable. No statistical algorithms, no backtesting, no AI,
> no persistence, no infrastructure, no API, no UI. It proposes and records; it never adjudicates.

## Purpose

Define ResearchLifecycle (PROPOSED/REGISTERED/DESIGNED/ACTIVE/UNDER_REVIEW/VALIDATED/APPROVED/ARCHIVED + SUSPENDED), the canonical transitions (revisions/suspension/reopening), and the lifecycle-service interface.

## Responsibilities

Enumerate the lifecycle and its legal transitions as data; VALIDATED/APPROVED require a passed deterministic gate; reopening a killed effort creates new lineage (RL-1); hold no logic.

## Relationships

Consumed by model, status, registration, management, policies.

## Dependencies

core_domain.shared (EntityId); standard library.

## Related Governance Documents

CLAUDE.md (RL-1/2, SM-3, CP-5); Architecture V2 §5.5; RB-02 · RMET; Experiment Tracking Governance.
