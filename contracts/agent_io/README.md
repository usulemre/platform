# contracts/agent_io — Tier-4 Agent I/O Contracts

> **Phase 0 scaffolding placeholder — structure only.** No business logic, no quantitative
> algorithms, no application code (Implementation Roadmap, Phase 0).

## Purpose

Artifact location for the Tier-4 agent input/output contracts (per CLAUDE.md Table of Authority). The governing framework is docs/contracts/agent_contracts.md.

## Scope

Establishes the governed home for this module's contracts, interfaces, and documentation so
all later construction is compliant by construction. In Phase 0 this directory holds only
scaffolding; implementation lands in the phase noted below under contract-first governance.

## Responsibilities

Hold the contract skeletons, interface placeholders, and documentation for this module.
Adjudication and consequential decisions belong to the deterministic engines
(Architecture V2 §5.6/§6.3) and are never performed here.

## Allowed Contents

Versioned, semantically-versioned contract/schema skeletons; documentation.

## Forbidden Contents

Implementations or business logic; a single global monolithic schema (P5-02); breaking a published contract without a major-version bump and governed migration (VER-1/2).

## Ownership

Accountable role: HAI / ARB. Architecture owner: ARB (Architecture V2 §9); every layer has a
named domain lead accountable for conformance.

## Architecture Mapping

Contracts Spine (Architecture V2 §5.10) — implemented in Phase 0/1 (Implementation Roadmap, Part C).

## Dependencies

shared/; packages/shared-types. Dependencies flow inward toward stable contracts only (IMP-12, AV2-13); direct
cross-layer access to internals and circular dependencies are PROHIBITED.

## Related Governance Documents

CLAUDE.md; Architecture V2; Implementation Roadmap; Agent Contracts (Tier-4); RB-15 · AIGOV; P4-02.
