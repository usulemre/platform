# research-service · repositories

> **Phase 2.1 Research Service — institutional research model, interfaces only.** Deterministic,
> technology-independent, immutable, auditable. No statistical algorithms, no backtesting, no AI,
> no persistence, no infrastructure, no API, no UI. It proposes and records; it never adjudicates.

## Purpose

Define the Research Service repository interfaces: ResearchRepositoryContract (append-only), ResearchDependencyRepository.

## Responsibilities

Express append-only, immutable retrieval of research initiatives and their dependencies as interfaces; backward transitions create new lineage; hold no persistence.

## Relationships

Consumed by management; complements core_domain.research repositories.

## Dependencies

core_domain.shared (EntityId); model; dependencies.

## Related Governance Documents

CLAUDE.md (CP-2, RL-1, SM-5); Architecture V2 §5.5; RB-02 · RMET; Experiment Tracking Governance.
