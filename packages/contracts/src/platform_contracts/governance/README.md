# contracts · Governance module

> **Phase 1.2 Shared Contracts Foundation — contracts only.** Immutable, technology-independent,
> framework-independent. No business logic, no persistence, no API, no infrastructure.

## Purpose

Define the contracts for human approvals, capital-eligibility tokens, overrides, and the tamper-evident audit trail.

## Responsibilities

Carry commands (RequestApproval, RecordOverride, IssueCapitalEligibility), the GetApproval query, governance events, and approval/token DTOs; expose the approval-engine and audit-trail contracts.

## Public Interfaces

ApprovalRepositoryContract, AuditTrailContract, ApprovalEngineContract, TieredAutonomyPolicyContract; events ProductionDeploymentApproved, OverrideRecorded, GovernanceHalt.

## Dependencies

platform_contracts.common (the contract kernel) only. No third-party, framework, or infrastructure
deps; no dependency on the domain model (contracts are the stable waist — mapping to domain objects
happens in an outer anti-corruption layer, never here or in the domain).

## Boundaries

Immutable (frozen) and versioned (every message carries a schema version, VER-1/2). Cross-context
references are by identity only (Id / VersionTag), never by embedding another context's aggregate
(SE-2). Commands/queries are requests to deterministic engines/services; a contract never decides.

## Related Domains

core-domain governance context; Strategy, Validation, and Execution contracts.

## Forbidden Responsibilities

MUST NOT let AI override a human decision; MUST NOT approve capital without counter-sign; MUST NOT use an override to bypass statistical/risk controls.

## Related Governance Documents

/Users/smartiks/platform/packages/contracts/src/platform_contracts/governance0
