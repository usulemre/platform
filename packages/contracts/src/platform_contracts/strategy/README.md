# contracts · Strategy module

> **Phase 1.2 Shared Contracts Foundation — contracts only.** Immutable, technology-independent,
> framework-independent. No business logic, no persistence, no API, no infrastructure.

## Purpose

Define the contracts for the strategy lifecycle, including retirement and the capital-eligibility token reference.

## Responsibilities

Carry commands (RegisterStrategy, RetireStrategy), the GetStrategy query, the StrategyApproved event, and strategy DTOs; expose the lifecycle contract.

## Public Interfaces

StrategyRepositoryContract, StrategyLifecycleServiceContract; events StrategyRegistered, StrategyApproved, StrategyRetired.

## Dependencies

platform_contracts.common (the contract kernel) only. No third-party, framework, or infrastructure
deps; no dependency on the domain model (contracts are the stable waist — mapping to domain objects
happens in an outer anti-corruption layer, never here or in the domain).

## Boundaries

Immutable (frozen) and versioned (every message carries a schema version, VER-1/2). Cross-context
references are by identity only (Id / VersionTag), never by embedding another context's aggregate
(SE-2). Commands/queries are requests to deterministic engines/services; a contract never decides.

## Related Domains

core-domain strategy context; Signal, Validation, Portfolio, and Governance contracts.

## Forbidden Responsibilities

MUST NOT mark eligible without a token; MUST NOT promote without replication and the scientific gate.

## Related Governance Documents

/Users/smartiks/platform/packages/contracts/src/platform_contracts/strategy0
