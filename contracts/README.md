# contracts/ — Contract Registry (the integration substrate)

> **Phase 0 scaffolding placeholder.** Structure only — contract artifacts are defined
> contract-first as each layer is built.

## Purpose

The single home for the platform's **contracts** — the stable, versioned interfaces every
component depends on instead of depending on implementations (IMP-10, SE-3). This is the
Contracts Spine made concrete (Architecture V2 §5.10); it MUST NOT re-monolithize into a
single global schema (AR-3, P5-02).

## Scope

Contract definitions only (schemas, interface specifications), organized by bounded context.
The **governance frameworks** that own the contract _rules_ live in `docs/contracts/`
(Tier-4 Agent Contracts, Tier-5 Workflow Contracts) and are not restated here.

## Members

- `agent_io/` — Tier-4 agent I/O contract artifacts (per CLAUDE.md Table of Authority).
- `workflows/` — Tier-5 workflow contract artifacts.
- `services/` — service-to-service contracts (bounded-context waist).
- `api/` — external/human-facing API contracts consumed by `apps/`.
- `domain/` — shared domain contracts / value-object schemas.

## Allowed Contents

Versioned, semantically-versioned contract skeletons and schema placeholders; documentation.

## Forbidden Contents

Implementations or business logic; a single global monolithic schema (P5-02); breaking a
published contract without a major version bump and migration (VER-1/2, IMP-11).

## Ownership

Accountable role: ARB (owns contracts); domain leads co-own their context's contracts.

## Dependencies

Contracts are the innermost stable abstractions — they depend on nothing but the shared
kernel (`shared/`, `packages/shared-types`). Everything else depends on them.

## Related Governance Documents

CLAUDE.md (SE-2/3, VER-1/2); Architecture V2 §5.10; Agent Contracts; Workflow Contracts;
Implementation Roadmap Phase 0 (contract registry skeleton).
