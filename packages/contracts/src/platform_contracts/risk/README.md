# contracts · Risk module

> **Phase 1.2 Shared Contracts Foundation — contracts only.** Immutable, technology-independent,
> framework-independent. No business logic, no persistence, no API, no infrastructure.

## Purpose

Define the contracts for independent, deterministic risk limits and the human-invocable kill-switch.

## Responsibilities

Carry commands (EvaluateRisk, EngageKillSwitch), the GetRiskAssessment query, the RiskValidated event, and risk DTOs; expose the limit-engine and kill-switch contracts.

## Public Interfaces

RiskLimitRepositoryContract, RiskLimitEngineContract, KillSwitchContract; events RiskValidated, LimitBreached, KillSwitchEngaged.

## Dependencies

platform_contracts.common (the contract kernel) only. No third-party, framework, or infrastructure
deps; no dependency on the domain model (contracts are the stable waist — mapping to domain objects
happens in an outer anti-corruption layer, never here or in the domain).

## Boundaries

Immutable (frozen) and versioned (every message carries a schema version, VER-1/2). Cross-context
references are by identity only (Id / VersionTag), never by embedding another context's aggregate
(SE-2). Commands/queries are requests to deterministic engines/services; a contract never decides.

## Related Domains

core-domain risk context; Portfolio and Execution contracts.

## Forbidden Responsibilities

MUST NOT let AI decide a halt/kill-switch; MUST NOT be overridden by the first line; MUST NOT report to research.

## Related Governance Documents

/Users/smartiks/platform/packages/contracts/src/platform_contracts/risk0
