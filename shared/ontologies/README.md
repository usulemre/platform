# shared/ontologies — Factor & Feature Ontologies

> **Phase 0 scaffolding placeholder — structure only.** No business logic, no quantitative
> algorithms, no application code (Implementation Roadmap, Phase 0).

## Purpose

The shared classification vocabulary in which new features and factors MUST be classified (KM-3); prevents factor-zoo redundancy.

## Scope

Establishes the governed home for this module's contracts, interfaces, and documentation so
all later construction is compliant by construction. In Phase 0 this directory holds only
scaffolding; implementation lands in the phase noted below under contract-first governance.

## Responsibilities

Hold the contract skeletons, interface placeholders, and documentation for this module.
Adjudication and consequential decisions belong to the deterministic engines
(Architecture V2 §5.6/§6.3) and are never performed here.

## Allowed Contents

Definition skeletons (ontology / vocabulary / enum) and documentation.

## Forbidden Contents

Behavior, business logic, or algorithms; asset-class-specific names in the core (NM-4, CP-8); duplication of contract schemas.

## Ownership

Accountable role: ARB / PE. Architecture owner: ARB (Architecture V2 §9); every layer has a
named domain lead accountable for conformance.

## Architecture Mapping

Cross-cutting shared kernel (Architecture V2 §5) — implemented in Phase 1 (Implementation Roadmap, Part C).

## Dependencies

nothing (innermost kernel). Dependencies flow inward toward stable contracts only (IMP-12, AV2-13); direct
cross-layer access to internals and circular dependencies are PROHIBITED.

## Related Governance Documents

CLAUDE.md; Architecture V2; Implementation Roadmap; KM-1..3; RB-09/10 · FAR; P3-06.
