# workflow-engine · state

> **Phase 1.3 Workflow Engine Foundation — abstractions only.** Deterministic, technology- and
> framework-independent. No workflow logic, no orchestration, no infrastructure, no persistence,
> no AI. Interfaces are placeholders.

## Purpose

Define the canonical workflow lifecycle (WorkflowState) and state categories, plus the terminal and failure state sets.

## Responsibilities

Enumerate PROPOSED/REGISTERED/READY/RUNNING/VALIDATING/APPROVED/COMPLETED and the failure/holding states; declare terminal and failure sets. Data only.

## Dependencies

Standard library (enum) only.

## Relationships

Consumed by transition, state_machine, instance, events, audit, policies, results.

## Related Governance Documents

CLAUDE.md (RL-1, WCON-1); Architecture V2 §5.4; Workflow Contracts (universal state machine, WFC-14/16/19).
