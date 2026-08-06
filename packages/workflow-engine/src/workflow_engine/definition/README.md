# workflow-engine · definition

> **Phase 1.3 Workflow Engine Foundation — abstractions only.** Deterministic, technology- and
> framework-independent. No workflow logic, no orchestration, no infrastructure, no persistence,
> no AI. Interfaces are placeholders.

## Purpose

Define Workflow and WorkflowDefinition: the immutable, versioned, contract-bound process definition (declared transitions + metadata).

## Responsibilities

Represent a workflow's declared shape as immutable data; a material change creates a new version, never a mutation (WCON-1).

## Dependencies

platform_contracts.common (VersionTag); workflow_engine.transition, workflow_engine.metadata.

## Relationships

Consumed by execution; instantiated as WorkflowInstance.

## Related Governance Documents

CLAUDE.md (WCON-1, VER-1/2); Architecture V2 §5.4; Workflow Contracts (WFC-4/6/11).
