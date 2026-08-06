# workflow-engine · approval

> **Phase 1.3 Workflow Engine Foundation — abstractions only.** Deterministic, technology- and
> framework-independent. No workflow logic, no orchestration, no infrastructure, no persistence,
> no AI. Interfaces are placeholders.

## Purpose

Define WorkflowApproval (an immutable human-approval record with counter-sign and rationale) and the WorkflowApprovalGate interface.

## Responsibilities

Represent approval as a human decision recorded with identity and rationale; require counter-sign for capital-affecting approvals; AI never approves.

## Dependencies

platform_contracts.common (ActorRef); workflow_engine.context; standard library.

## Relationships

Relates to the Governance domain / Human Governance Layer.

## Related Governance Documents

CLAUDE.md (HO-1..4, AV2-4); Architecture V2 §5.1, §5.4, §6.2; Workflow Contracts (WFC-13 approval requirements).
