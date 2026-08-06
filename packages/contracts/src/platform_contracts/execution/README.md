# contracts · Execution module

> **Phase 1.2 Shared Contracts Foundation — contracts only.** Immutable, technology-independent,
> framework-independent. No business logic, no persistence, no API, no infrastructure.

## Purpose

Define the contracts for paper-first, token-gated, deterministic execution and reconciliation.

## Responsibilities

Carry the AuthorizeExecution command, the GetOrder query, the ExecutionAuthorized event, and order/token/parity DTOs; expose the execution-authority contract.

## Public Interfaces

OrderRepositoryContract, ExecutionAuthorityContract, ParityHarnessContract, ReconciliationServiceContract; events ExecutionAuthorized, FillRecorded, ParityBreachDetected.

## Dependencies

platform_contracts.common (the contract kernel) only. No third-party, framework, or infrastructure
deps; no dependency on the domain model (contracts are the stable waist — mapping to domain objects
happens in an outer anti-corruption layer, never here or in the domain).

## Boundaries

Immutable (frozen) and versioned (every message carries a schema version, VER-1/2). Cross-context
references are by identity only (Id / VersionTag), never by embedding another context's aggregate
(SE-2). Commands/queries are requests to deterministic engines/services; a contract never decides.

## Related Domains

core-domain execution context; Portfolio, Risk, and Governance contracts.

## Forbidden Responsibilities

MUST NOT execute without authorization; MUST NOT let AI decide/authorize execution; MUST NOT deploy irreversibly.

## Related Governance Documents

/Users/smartiks/platform/packages/contracts/src/platform_contracts/execution0
