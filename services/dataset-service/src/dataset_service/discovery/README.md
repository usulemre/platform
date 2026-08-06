# dataset-service · discovery

> **Phase 2.0 Data Platform — canonical module, interfaces only.** Deterministic, technology-
> independent, immutable, auditable. No ingestion, no storage engine, no database, no API, no
> external connector, no persistence. Interfaces are placeholders.

## Purpose

Define DiscoveryQuery, DiscoveryResult, and the DatasetDiscovery interface: access-filtered dataset discovery over the catalog.

## Responsibilities

Expose search/discovery that never surfaces data above the caller's clearance; hold no storage.

## Relationships

Consumes the catalog; enforces access control.

## Dependencies

metadata; model.

## Related Governance Documents

CLAUDE.md (SEC-2, DP-1); Architecture V2 §5.8, §6.5; Dataset Governance.
