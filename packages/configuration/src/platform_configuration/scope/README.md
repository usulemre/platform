# configuration · scope

> **Phase 1.5 Configuration Foundation — abstractions only.** Technology-independent, deterministic,
> immutable, versionable. No loading, no environment parsing, no secret storage, no persistence,
> no infrastructure, no business logic. Interfaces are placeholders.

## Purpose

Define the institutional configuration scopes (Global, Platform, Application, Service, Workflow, Agent, Experiment, Dataset, Environment, Deployment, Local), their precedence, and the ScopeSelector.

## Responsibilities

Enumerate scopes and their broad-to-narrow precedence (narrower overrides); data only, no resolution logic.

## Dependencies

Standard library (enum) only.

## Relationships

Consumed by model, metadata, policies, registry.

## Related Governance Documents

CLAUDE.md (CP-8, SC-1); Architecture V2 §5.10; RB-27 · SEC; TDR §20.
