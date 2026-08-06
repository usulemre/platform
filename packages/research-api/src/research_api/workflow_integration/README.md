# research-api · workflow_integration

> **Phase 3.6 Research API — application interface, contracts & interfaces only.** Technology-
> independent, stateless, secure, auditable. No HTTP framework code, no endpoints, no controller
> implementations, no business logic, no research implementation, no infrastructure. Delegates to
> application services; exposes no internal domain models.

## Purpose

Define ApiWorkflowTrigger: the API workflow-trigger interface using the Workflow Engine (Tier-5 contracts).

## Responsibilities

Trigger approved Tier-5 workflows for consequential operations; never bypass Workflow Contracts; the API orchestrates by triggering, it never adjudicates; hold no logic.

## Relationships

Uses workflow_engine; third stage of the API pipeline; realizes the staged chain.

## Dependencies

workflow_engine (WorkflowContext, WorkflowInstance).

## Related Governance Documents

CLAUDE.md (WCON-2, AV2-18, RG-3); Architecture V2 §5.4, §7; Workflow Contracts; Workflow Engine.
