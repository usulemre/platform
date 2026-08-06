# admin-api · workflow_integration

> **Phase 3.7 Admin API — administrative interface, contracts & interfaces only.** Technology-
> independent, secure, stateless, auditable. No HTTP framework code, no endpoints, no controller
> implementations, no business logic, no infrastructure, no UI. Delegates to administrative
> application services; enforces governance/authorization/audit; exposes no internal domain models.

## Purpose

Define AdminWorkflowTrigger: the admin workflow-trigger interface using the Workflow Engine (Tier-5 contracts).

## Responsibilities

Trigger approved Tier-5 workflows for consequential admin operations; never bypass Workflow Contracts; the API orchestrates by triggering, it never adjudicates; hold no logic.

## Relationships

Uses workflow_engine; fourth stage of the admin pipeline.

## Dependencies

workflow_engine (WorkflowContext, WorkflowInstance).

## Related Governance Documents

CLAUDE.md (WCON-2, AV2-18, RG-3); Architecture V2 §5.4, §7; Workflow Contracts; Workflow Engine.
