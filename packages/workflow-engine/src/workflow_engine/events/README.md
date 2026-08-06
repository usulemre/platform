# workflow-engine · events

> **Phase 1.3 Workflow Engine Foundation — abstractions only.** Deterministic, technology- and
> framework-independent. No workflow logic, no orchestration, no infrastructure, no persistence,
> no AI. Interfaces are placeholders.

## Purpose

Define the immutable workflow lifecycle events: WorkflowCreated, WorkflowStarted, WorkflowPaused, WorkflowResumed, WorkflowValidated, WorkflowApproved, WorkflowRejected, WorkflowCompleted, WorkflowFailed, WorkflowEscalated.

## Responsibilities

Represent lifecycle facts as immutable events carrying the contract envelope (identity, version, supplied time); records, not commands.

## Dependencies

platform_contracts.common (Event, Id); standard library.

## Relationships

Published to the run ledger/audit; complement the contract-layer workflow events.

## Related Governance Documents

CLAUDE.md (CP-2/7, WCON-3); Architecture V2 §5.4, §5.10; Workflow Contracts (run history).
