# workflow-engine · results

> **Phase 1.3 Workflow Engine Foundation — abstractions only.** Deterministic, technology- and
> framework-independent. No workflow logic, no orchestration, no infrastructure, no persistence,
> no AI. Interfaces are placeholders.

## Purpose

Define WorkflowResult and WorkflowError: the immutable outcome and structured error of a workflow run.

## Responsibilities

Represent run outcomes as immutable data; hold no logic.

## Dependencies

platform_contracts.common (Id); workflow_engine.state; standard library.

## Relationships

Consumed by callers and the run ledger/audit.

## Related Governance Documents

CLAUDE.md (CP-2/7); Architecture V2 §5.4; Workflow Contracts (run history).
