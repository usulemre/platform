# workflow-engine · metadata

> **Phase 1.3 Workflow Engine Foundation — abstractions only.** Deterministic, technology- and
> framework-independent. No workflow logic, no orchestration, no infrastructure, no persistence,
> no AI. Interfaces are placeholders.

## Purpose

Define WorkflowMetadata: name, accountable owner, the referenced Tier-5 contract id, version, and description.

## Responsibilities

Carry immutable, versioned descriptive metadata; reference (never restate) the governing Tier-5 Workflow Contract.

## Dependencies

platform_contracts.common (SchemaVersion); standard library.

## Relationships

Consumed by definition.

## Related Governance Documents

CLAUDE.md (WCON-1, VER-1); Architecture V2 §5.4; Workflow Contracts (WFC-8 ownership, WFC-6 versioning).
