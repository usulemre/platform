# contracts · Agent module

> **Phase 1.2 Shared Contracts Foundation — contracts only.** Immutable, technology-independent,
> framework-independent. No business logic, no persistence, no API, no infrastructure.

## Purpose

Define the contracts for registered, contract-bound, advisory-only AI agents (propose/narrate, model-pinned).

## Responsibilities

Carry commands (RegisterAgent, CertifyAgent, SuspendAgent, RecordAgentOutput), the GetAgentRegistration query, agent events, and registration/model-pin DTOs; expose the registry and policy contracts.

## Public Interfaces

AgentRegistryPortContract, ModelRegistryPortContract, AgentAuthorityPolicyContract, IsolationPolicyContract; events AgentCertified, AgentSuspended, AgentOutputRecorded.

## Dependencies

platform_contracts.common (the contract kernel) only. No third-party, framework, or infrastructure
deps; no dependency on the domain model (contracts are the stable waist — mapping to domain objects
happens in an outer anti-corruption layer, never here or in the domain).

## Boundaries

Immutable (frozen) and versioned (every message carries a schema version, VER-1/2). Cross-context
references are by identity only (Id / VersionTag), never by embedding another context's aggregate
(SE-2). Commands/queries are requests to deterministic engines/services; a contract never decides.

## Related Domains

core-domain agent context; Workflow and all narrated engines.

## Forbidden Responsibilities

MUST NOT carry or grant decide authority; MUST NOT permit self-edit/self-escalation; MUST NOT allow an unpinned model or an isolation breach.

## Related Governance Documents

/Users/smartiks/platform/packages/contracts/src/platform_contracts/agent0
