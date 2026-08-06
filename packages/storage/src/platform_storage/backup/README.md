# storage · backup

> **Phase 3.2 Storage Layer — vendor-independent abstractions, interfaces only.** Technology- and
> vendor-independent, composable, auditable. No database/SQL, no object-storage/persistence, no
> business logic, no infrastructure. Exposes only canonical storage interfaces; supports immutable
> artifacts, reproducible experiments, and governance traceability.

## Purpose

Define BackupPolicy and the BackupService interface: DR/BCP backup and restore with target RPO/RTO.

## Responsibilities

Represent backup policy (RPO/RTO/frequency) and expose backup/restore as an interface; hold no infrastructure.

## Relationships

Supports lifecycle recovery; realized by the DR/BCP layer (tested RPO/RTO).

## Dependencies

platform_contracts.common (Id); standard library.

## Related Governance Documents

CLAUDE.md (RE-3, DEP-3); Architecture V2 §5.10, §10; Disaster Recovery Governance; P6-03.
