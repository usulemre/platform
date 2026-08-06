# dataset-service · access_control

> **Phase 2.0 Data Platform — canonical module, interfaces only.** Deterministic, technology-
> independent, immutable, auditable. No ingestion, no storage engine, no database, no API, no
> external connector, no persistence. Interfaces are placeholders.

## Purpose

Define DatasetAccessPolicy, AccessLevel, and the AccessControl interface: least-privilege, need-to-know dataset access.

## Responsibilities

Express default-deny, need-to-know access (crown-jewel data restricted) as policy + interface; enforcement is deterministic; hold no logic.

## Relationships

Consumed by services and the security spine.

## Dependencies

core_domain.shared (EntityId); model.

## Related Governance Documents

CLAUDE.md (SEC-2, SEC-3, AV2-25); Architecture V2 §5.8, §6.5; RB-27 · SEC; Dataset Governance.
