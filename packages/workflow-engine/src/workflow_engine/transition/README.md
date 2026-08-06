# workflow-engine · transition

> **Phase 1.3 Workflow Engine Foundation — abstractions only.** Deterministic, technology- and
> framework-independent. No workflow logic, no orchestration, no infrastructure, no persistence,
> no AI. Interfaces are placeholders.

## Purpose

Define WorkflowTransition, TransitionKind (normal/validation-gate/approval-point/rollback/escalation), and TransitionSpec with named pre/postconditions.

## Responsibilities

Represent declared transitions as immutable data; hold no evaluation logic (conditions are evaluated by an outer deterministic engine, WCON-2).

## Dependencies

workflow_engine.state; standard library.

## Relationships

Consumed by state_machine, definition, execution, policies.

## Related Governance Documents

CLAUDE.md (WCON-1/2); Architecture V2 §5.4; Workflow Contracts (WFC-16 declared transitions with pre/postconditions).
