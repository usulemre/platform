# contracts · Signal module

> **Phase 1.2 Shared Contracts Foundation — contracts only.** Immutable, technology-independent,
> framework-independent. No business logic, no persistence, no API, no infrastructure.

## Purpose

Define the contracts for the signal generation lifecycle (net-of-cost, isolation-respecting).

## Responsibilities

Carry commands (RegisterSignal, RetireSignal), the GetSignal query, the SignalGenerated event, and signal DTOs; expose the lifecycle contract.

## Public Interfaces

SignalRepositoryContract, SignalLifecycleServiceContract; events SignalGenerated, SignalRetired.

## Dependencies

platform_contracts.common (the contract kernel) only. No third-party, framework, or infrastructure
deps; no dependency on the domain model (contracts are the stable waist — mapping to domain objects
happens in an outer anti-corruption layer, never here or in the domain).

## Boundaries

Immutable (frozen) and versioned (every message carries a schema version, VER-1/2). Cross-context
references are by identity only (Id / VersionTag), never by embedding another context's aggregate
(SE-2). Commands/queries are requests to deterministic engines/services; a contract never decides.

## Related Domains

core-domain signal context; Feature and Strategy contracts.

## Forbidden Responsibilities

MUST NOT select on gross performance; MUST NOT observe validation/OOS outcomes (isolation barrier).

## Related Governance Documents

/Users/smartiks/platform/packages/contracts/src/platform_contracts/signal0
