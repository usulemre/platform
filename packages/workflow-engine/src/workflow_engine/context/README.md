# workflow-engine · context

> **Phase 1.3 Workflow Engine Foundation — abstractions only.** Deterministic, technology- and
> framework-independent. No workflow logic, no orchestration, no infrastructure, no persistence,
> no AI. Interfaces are placeholders.

## Purpose

Define WorkflowContext: the immutable, deterministic context (instance id, correlation, actor, as-of) passed to each workflow step.

## Responsibilities

Carry step context by value; supply the as-of boundary for point-in-time reads; read no ambient time.

## Dependencies

platform_contracts.common (Id, CorrelationId, ActorRef); standard library.

## Relationships

Consumed by validation, approval, escalation, execution.

## Related Governance Documents

CLAUDE.md (PIT-1, CS-3, CP-7); Architecture V2 §5.4; Workflow Contracts (traceability).
