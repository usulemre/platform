# workflow-engine · state_machine

> **Phase 1.3 Workflow Engine Foundation — abstractions only.** Deterministic, technology- and
> framework-independent. No workflow logic, no orchestration, no infrastructure, no persistence,
> no AI. Interfaces are placeholders.

## Purpose

Define the canonical allowed transitions, forbidden transitions (stage-skips), approval points, validation gates, rollback points, terminal states, and the StateMachine interface.

## Responsibilities

Declare the legal transition set as immutable data and expose a fail-closed StateMachine interface; hold no evaluation logic (a deterministic engine enforces it).

## Dependencies

workflow_engine.state, workflow_engine.transition; standard library.

## Relationships

Consumed by execution and policies; enforced by an outer deterministic engine.

## Related Governance Documents

CLAUDE.md (WCON-1/2, RG-3); Architecture V2 §5.4, §7; Workflow Contracts (WFC-3/16/17/41, AV2-18).
