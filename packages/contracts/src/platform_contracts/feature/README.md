# contracts · Feature module

> **Phase 1.2 Shared Contracts Foundation — contracts only.** Immutable, technology-independent,
> framework-independent. No business logic, no persistence, no API, no infrastructure.

## Purpose

Define the contracts for declarative, PIT-bound, leakage-clean features and the marketplace.

## Responsibilities

Carry commands (ProposeFeature, AcceptFeature), the GetFeature query, the FeatureAccepted event, and feature/leakage DTOs; expose the Leakage Harness contract.

## Public Interfaces

FeatureRepositoryContract, FeatureMarketplaceContract, LeakageHarnessContract; events FeatureProposed, FeatureAccepted.

## Dependencies

platform_contracts.common (the contract kernel) only. No third-party, framework, or infrastructure
deps; no dependency on the domain model (contracts are the stable waist — mapping to domain objects
happens in an outer anti-corruption layer, never here or in the domain).

## Boundaries

Immutable (frozen) and versioned (every message carries a schema version, VER-1/2). Cross-context
references are by identity only (Id / VersionTag), never by embedding another context's aggregate
(SE-2). Commands/queries are requests to deterministic engines/services; a contract never decides.

## Related Domains

core-domain feature context; Dataset and Signal contracts.

## Forbidden Responsibilities

MUST NOT accept a feature that is not leakage-clean or lacks provenance; MUST NOT self-accept.

## Related Governance Documents

/Users/smartiks/platform/packages/contracts/src/platform_contracts/feature0
