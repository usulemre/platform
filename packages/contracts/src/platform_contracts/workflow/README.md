# contracts · Workflow module

> **Phase 1.2 Shared Contracts Foundation — contracts only.** Immutable, technology-independent,
> framework-independent. No business logic, no persistence, no API, no infrastructure.

## Purpose

Define the contracts for the workflow state machine, transitions, and gates (orchestrate, never adjudicate).

## Responsibilities

Carry commands (StartWorkflow, AdvanceWorkflow), the GetWorkflowInstance query, the WorkflowCompleted event, and instance/gate DTOs; expose the engine/gate/compensator contracts.

## Public Interfaces

WorkflowRepositoryContract, RunLedgerContract, WorkflowEngineContract, GateEvaluatorContract, CompensatorContract; events WorkflowStarted, StageTransitioned, WorkflowCompleted, WorkflowEscalated.

## Dependencies

platform_contracts.common (the contract kernel) only. No third-party, framework, or infrastructure
deps; no dependency on the domain model (contracts are the stable waist — mapping to domain objects
happens in an outer anti-corruption layer, never here or in the domain).

## Boundaries

Immutable (frozen) and versioned (every message carries a schema version, VER-1/2). Cross-context
references are by identity only (Id / VersionTag), never by embedding another context's aggregate
(SE-2). Commands/queries are requests to deterministic engines/services; a contract never decides.

## Related Domains

core-domain workflow context; all contexts it orchestrates.

## Forbidden Responsibilities

MUST NOT carry decision logic; MUST NOT permit undeclared transitions or stage-skipping; MUST NOT bypass a gate.

## Related Governance Documents

/Users/smartiks/platform/packages/contracts/src/platform_contracts/workflow0
