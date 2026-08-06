# dataset-service · lineage

> **Phase 2.0 Data Platform — canonical module, interfaces only.** Deterministic, technology-
> independent, immutable, auditable. No ingestion, no storage engine, no database, no API, no
> external connector, no persistence. Interfaces are placeholders.

## Purpose

Define DatasetLineage, LineageNode, LineageEdge, and the LineageGraph interface (with downstream invalidation).

## Responsibilities

Model complete lineage to raw sources and enable defect propagation (a source defect invalidates downstream); hold no persistence.

## Relationships

Consumed by repositories and services; relates to the platform lineage graph.

## Dependencies

core_domain.shared (EntityId, LineageRef); model.

## Related Governance Documents

CLAUDE.md (CP-6, DP-1/2, DEPR-2); Architecture V2 §5.8; RB-06/07 · DATA; Dataset Governance.
