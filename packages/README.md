# packages/ — Shared Libraries & SDKs

> **Phase 0 scaffolding placeholder.** Structure only — no business logic.

## Purpose

The versioned, reusable building blocks shared across services and apps: the domain model,
shared types, contract bindings, and the cross-cutting spines (configuration, logging,
observability, security, validation) plus the platform SDKs (workflow engine, AI runtime,
research SDK, data SDK). Consumers depend on **contracts, not implementations** (IMP-10).

## Scope

Reusable, side-effect-controlled libraries only. A package MUST NOT branch on asset class
(CP-8) and MUST be independently versioned (VER-1).

## Members

core-domain · shared-types · contracts · utilities · configuration · logging · observability ·
security · validation · workflow-engine · ai-runtime · research-sdk · data-sdk.

## Allowed Contents

Interface/type skeletons; contract bindings; documentation. Pure, replaceable libraries.

## Forbidden Contents

Business logic/algorithms in Phase 0; asset-class branching (CP-8); god-modules or
over-generic universal interfaces (AP-5); secrets (SEC-3, CODE-29); ambient time/RNG (CS-3).

## Ownership

Accountable role: PE / HSRE (platform); security package: CISO; ai-runtime: HAI. Architecture
owner: ARB.

## Dependencies

Packages depend inward toward stable abstractions only (IMP-12); no circular dependencies.
`core-domain` and `shared-types` are the innermost, dependency-free kernel packages.

## Related Governance Documents

CLAUDE.md; Architecture V2 §5.10; RB-20 · CODE; RB-26 · NAME; Implementation Roadmap Phases 0/1.
