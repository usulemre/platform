# contracts · Portfolio module

> **Phase 1.2 Shared Contracts Foundation — contracts only.** Immutable, technology-independent,
> framework-independent. No business logic, no persistence, no API, no infrastructure.

## Purpose

Define the contracts for deterministic, net-of-cost portfolio construction from eligible alphas.

## Responsibilities

Carry the ConstructPortfolio command, the GetPortfolio query, the PortfolioConstructed event, and portfolio/allocation DTOs; expose the optimizer contract.

## Public Interfaces

PortfolioRepositoryContract, PortfolioOptimizerContract; event PortfolioConstructed.

## Dependencies

platform_contracts.common (the contract kernel) only. No third-party, framework, or infrastructure
deps; no dependency on the domain model (contracts are the stable waist — mapping to domain objects
happens in an outer anti-corruption layer, never here or in the domain).

## Boundaries

Immutable (frozen) and versioned (every message carries a schema version, VER-1/2). Cross-context
references are by identity only (Id / VersionTag), never by embedding another context's aggregate
(SE-2). Commands/queries are requests to deterministic engines/services; a contract never decides.

## Related Domains

core-domain portfolio context; Strategy, Risk, and Execution contracts.

## Forbidden Responsibilities

MUST NOT optimize on gross returns; MUST NOT let AI decide allocation/sizing; MUST NOT consume ineligible alphas.

## Related Governance Documents

/Users/smartiks/platform/packages/contracts/src/platform_contracts/portfolio0
