# contracts · Dataset module

> **Phase 1.2 Shared Contracts Foundation — contracts only.** Immutable, technology-independent,
> framework-independent. No business logic, no persistence, no API, no infrastructure.

## Purpose

Define the contracts for certified, point-in-time data: registration, certification, vintages, and the mandatory as-of read.

## Responsibilities

Carry commands (RegisterDataset, CertifyDataset, RecordVintage), the ReadAsOf query, the DatasetValidated event, and dataset DTOs; expose the As-Of Gateway contract.

## Public Interfaces

DatasetRepositoryContract, AsOfGatewayContract, CertificationServiceContract; events DatasetRegistered, DatasetValidated, VintageRecorded.

## Dependencies

platform_contracts.common (the contract kernel) only. No third-party, framework, or infrastructure
deps; no dependency on the domain model (contracts are the stable waist — mapping to domain objects
happens in an outer anti-corruption layer, never here or in the domain).

## Boundaries

Immutable (frozen) and versioned (every message carries a schema version, VER-1/2). Cross-context
references are by identity only (Id / VersionTag), never by embedding another context's aggregate
(SE-2). Commands/queries are requests to deterministic engines/services; a contract never decides.

## Related Domains

core-domain dataset context; Feature and every engine (via the As-Of Gateway).

## Forbidden Responsibilities

MUST NOT permit a read without an as-of; MUST NOT overwrite a vintage; MUST NOT expose uncertified/OOS data.

## Related Governance Documents

/Users/smartiks/platform/packages/contracts/src/platform_contracts/dataset0
