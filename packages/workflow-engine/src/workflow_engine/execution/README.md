# workflow-engine · execution

> **Phase 1.3 Workflow Engine Foundation — abstractions only.** Deterministic, technology- and
> framework-independent. No workflow logic, no orchestration, no infrastructure, no persistence,
> no AI. Interfaces are placeholders.

## Purpose

Define the execution interfaces: WorkflowEngine (orchestrates transitions), StageRunner, Compensator (saga/rollback), and WorkflowExecution.

## Responsibilities

Represent execution as orchestration only: advance through declared transitions after gates pass; compensate on failure; NEVER adjudicate and NEVER run infrastructure/persistence here.

## Dependencies

workflow_engine.definition, workflow_engine.instance, workflow_engine.state, workflow_engine.context.

## Relationships

Realized by the workflow engine (Temporal, per the TDR); coordinates deterministic engines, agents, and humans.

## Related Governance Documents

CLAUDE.md (WCON-1/2, RE-1, DE-1); Architecture V2 §5.4; Workflow Contracts (WFC-16/19, AV2-18); TDR §15.
