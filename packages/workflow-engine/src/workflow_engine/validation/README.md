# workflow-engine · validation

> **Phase 1.3 Workflow Engine Foundation — abstractions only.** Deterministic, technology- and
> framework-independent. No workflow logic, no orchestration, no infrastructure, no persistence,
> no AI. Interfaces are placeholders.

## Purpose

Define WorkflowValidation (an immutable gate-outcome record) and the WorkflowValidationGate interface that delegates to a deterministic engine.

## Responsibilities

Represent validation as delegation: the workflow invokes the owning deterministic engine and routes on the outcome; it never adjudicates (WCON-2).

## Dependencies

workflow_engine.context; standard library.

## Relationships

Relates to the Validation domain / Quantitative Engine Layer (the actual adjudicator).

## Related Governance Documents

CLAUDE.md (WCON-2, DE-1, VS-1); Architecture V2 §5.4, §5.6, §6.3; Workflow Contracts (AV2-18).
