# research-service · management

> **Phase 2.1 Research Service — institutional research model, interfaces only.** Deterministic,
> technology-independent, immutable, auditable. No statistical algorithms, no backtesting, no AI,
> no persistence, no infrastructure, no API, no UI. It proposes and records; it never adjudicates.

## Purpose

Define the Research Service interfaces: ResearchService (lifecycle), ResearchManagementService (dependency/gate orchestration), ResearchCatalogService.

## Responsibilities

Orchestrate the research lifecycle and connect datasets/features/experiments/validation by dependency; record (never compute) deterministic gate outcomes; hold no adjudication, statistics, or AI.

## Relationships

Top-level module: composes model, dependencies, metadata, lifecycle, registration; routes to deterministic gates.

## Dependencies

core_domain.shared (EntityId); model; dependencies; metadata.

## Related Governance Documents

CLAUDE.md (CP-5, AI-2, AD-3, SM-3, DE-1); Architecture V2 §5.5, §6.1, §6.3; RB-02 · RMET; P2-07/09.
