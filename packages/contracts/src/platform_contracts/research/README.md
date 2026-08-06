# contracts · Research module

> **Phase 1.2 Shared Contracts Foundation — contracts only.** Immutable, technology-independent,
> framework-independent. No business logic, no persistence, no API, no infrastructure.

## Purpose

Define the contracts for the research lifecycle: registering ideas and pre-registering falsifiable hypotheses.

## Responsibilities

Carry commands (RegisterIdea, PreRegisterHypothesis), the GetHypothesis query, the ResearchCreated event, and hypothesis DTOs; expose repository/service interfaces.

## Public Interfaces

ResearchRepositoryContract, ResearchServiceContract, PreRegistrationPolicy, HypothesisValidationContract; events ResearchCreated, HypothesisPreRegistered.

## Dependencies

platform_contracts.common (the contract kernel) only. No third-party, framework, or infrastructure
deps; no dependency on the domain model (contracts are the stable waist — mapping to domain objects
happens in an outer anti-corruption layer, never here or in the domain).

## Boundaries

Immutable (frozen) and versioned (every message carries a schema version, VER-1/2). Cross-context
references are by identity only (Id / VersionTag), never by embedding another context's aggregate
(SE-2). Commands/queries are requests to deterministic engines/services; a contract never decides.

## Related Domains

core-domain research context; Experiment and Feature contracts.

## Forbidden Responsibilities

MUST NOT carry validation/promotion logic; MUST NOT let a command adjudicate significance; MUST NOT expose OOS.

## Related Governance Documents

/Users/smartiks/platform/packages/contracts/src/platform_contracts/research0
