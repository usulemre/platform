# contracts · Validation module

> **Phase 1.2 Shared Contracts Foundation — contracts only.** Immutable, technology-independent,
> framework-independent. No business logic, no persistence, no API, no infrastructure.

## Purpose

Define the contracts for the deterministic validation gauntlet, one-shot holdout, replication, and the scientific gate.

## Responsibilities

Carry commands (RunValidation, AllocateHoldout, RequestReplication), the GetVerdict query, the ValidationCompleted/CapitalEligibilityIssued events, and verdict DTOs; expose the engine contracts.

## Public Interfaces

ValidationRepositoryContract, MultipleTestingEnforcerContract, ValidationGauntletContract, HoldoutEmbargoManagerContract, ReplicationEngineContract, ScientificGateContract; events ValidationCompleted, HoldoutConsumed, CapitalEligibilityIssued.

## Dependencies

platform_contracts.common (the contract kernel) only. No third-party, framework, or infrastructure
deps; no dependency on the domain model (contracts are the stable waist — mapping to domain objects
happens in an outer anti-corruption layer, never here or in the domain).

## Boundaries

Immutable (frozen) and versioned (every message carries a schema version, VER-1/2). Cross-context
references are by identity only (Id / VersionTag), never by embedding another context's aggregate
(SE-2). Commands/queries are requests to deterministic engines/services; a contract never decides.

## Related Domains

core-domain validation context; Experiment, Strategy, and Governance contracts.

## Forbidden Responsibilities

MUST NOT let an LLM assert significance/verdict; MUST NOT reuse OOS iteratively; MUST NOT present undeflated significance.

## Related Governance Documents

/Users/smartiks/platform/packages/contracts/src/platform_contracts/validation0
