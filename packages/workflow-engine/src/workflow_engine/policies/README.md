# workflow-engine · policies

> **Phase 1.3 Workflow Engine Foundation — abstractions only.** Deterministic, technology- and
> framework-independent. No workflow logic, no orchestration, no infrastructure, no persistence,
> no AI. Interfaces are placeholders.

## Purpose

Define the deterministic workflow policy interfaces: WorkflowPolicy, StateMachinePolicy, StageSkipPolicy, GateOwnershipPolicy.

## Responsibilities

Express the rules a deterministic engine enforces (legal transitions, no stage-skips, gate ownership) as interfaces; hold no logic.

## Dependencies

workflow_engine.state; standard library.

## Relationships

Enforced by the deterministic workflow engine; consumed by execution.

## Related Governance Documents

CLAUDE.md (WCON-1/2, DE-1, RG-3); Architecture V2 §5.4; Workflow Contracts (WFC-3/16/17).
