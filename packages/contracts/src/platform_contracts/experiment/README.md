# contracts · Experiment module

> **Phase 1.2 Shared Contracts Foundation — contracts only.** Immutable, technology-independent,
> framework-independent. No business logic, no persistence, no API, no infrastructure.

## Purpose

Define the contracts for registered experiments and the append-only Trial Ledger.

## Responsibilities

Carry commands (RegisterExperiment, RecordTrial), the GetExperiment query, the ExperimentRegistered event, and manifest DTOs; expose the Trial Ledger contract.

## Public Interfaces

ExperimentRepositoryContract, TrialLedgerContract, ExperimentServiceContract; events ExperimentRegistered, TrialRecorded.

## Dependencies

platform_contracts.common (the contract kernel) only. No third-party, framework, or infrastructure
deps; no dependency on the domain model (contracts are the stable waist — mapping to domain objects
happens in an outer anti-corruption layer, never here or in the domain).

## Boundaries

Immutable (frozen) and versioned (every message carries a schema version, VER-1/2). Cross-context
references are by identity only (Id / VersionTag), never by embedding another context's aggregate
(SE-2). Commands/queries are requests to deterministic engines/services; a contract never decides.

## Related Domains

core-domain experiment context; Research and Validation contracts.

## Forbidden Responsibilities

MUST NOT run an unregistered experiment; MUST NOT mutate a manifest; MUST NOT compute significance (that is Validation).

## Related Governance Documents

/Users/smartiks/platform/packages/contracts/src/platform_contracts/experiment0
