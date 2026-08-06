# workflow-engine · instance

> **Phase 1.3 Workflow Engine Foundation — abstractions only.** Deterministic, technology- and
> framework-independent. No workflow logic, no orchestration, no infrastructure, no persistence,
> no AI. Interfaces are placeholders.

## Purpose

Define WorkflowInstance: an immutable snapshot of a running workflow (id, definition, current state, explicit owner).

## Responsibilities

Represent instance state as an append-only, immutable snapshot; never mutate — transitions create new snapshots.

## Dependencies

platform_contracts.common (Id, VersionTag); workflow_engine.state.

## Relationships

Consumed by execution, audit, results.

## Related Governance Documents

CLAUDE.md (CP-2, WCON-1); Architecture V2 §5.4; Workflow Contracts (WFC-8 ownership, run history).
