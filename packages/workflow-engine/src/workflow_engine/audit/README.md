# workflow-engine · audit

> **Phase 1.3 Workflow Engine Foundation — abstractions only.** Deterministic, technology- and
> framework-independent. No workflow logic, no orchestration, no infrastructure, no persistence,
> no AI. Interfaces are placeholders.

## Purpose

Define WorkflowAuditRecord (immutable, hash-chained) and the WorkflowAuditTrail and RunLedger interfaces.

## Responsibilities

Represent audit/run history as append-only, tamper-evident records; hold no storage logic.

## Dependencies

platform_contracts.common (ActorRef, Id); workflow_engine.instance, workflow_engine.state.

## Relationships

Feeds the Observability/Audit spine and Governance.

## Related Governance Documents

CLAUDE.md (CP-7, SEC-4, OB-1, WCON-3); Architecture V2 §5.4, §5.10; Workflow Contracts (traceability).
