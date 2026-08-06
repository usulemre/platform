# ai-runtime (package)

> **Phase 0 scaffolding placeholder — structure only.** No business logic, no quantitative
> algorithms, no application code (Implementation Roadmap, Phase 0).

## Purpose

The contract-bound agent runtime — model pinning, versioned prompts, provenance recording, default-deny tools, and isolation-aware, advisory-only execution. AI is never in a decision path.

## Scope

Establishes the governed home for this module's contracts, interfaces, and documentation so
all later construction is compliant by construction. In Phase 0 this directory holds only
scaffolding; implementation lands in the phase noted below under contract-first governance.

## Responsibilities

Hold the contract skeletons, interface placeholders, and documentation for this module.
Adjudication and consequential decisions belong to the deterministic engines
(Architecture V2 §5.6/§6.3) and are never performed here.

## Allowed Contents

Interface/type skeletons; contract bindings; documentation.

## Forbidden Contents

Business logic or algorithms in Phase 0; asset-class branching (CP-8); god-modules or over-generic universal interfaces (AP-5); secrets (SEC-3); ambient time/RNG access (CS-3).

## Ownership

Accountable role: HAI. Architecture owner: ARB (Architecture V2 §9); every layer has a
named domain lead accountable for conformance.

## Architecture Mapping

Agent and AI Orchestration Layers (Architecture V2 §5.2/§5.3) — implemented in Phase 5 (Implementation Roadmap, Part C).

## Dependencies

security; observability; the deterministic engines it defers to. Dependencies flow inward toward stable contracts only (IMP-12, AV2-13); direct
cross-layer access to internals and circular dependencies are PROHIBITED.

## Related Governance Documents

CLAUDE.md; Architecture V2; Implementation Roadmap; RB-15 · AIGOV; Agent Contracts; Agent Registry; P4-01/03, P2-07.
