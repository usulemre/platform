# Validation Service

> **Phase 0 scaffolding placeholder — structure only.** No business logic, no quantitative
> algorithms, no application code (Implementation Roadmap, Phase 0).

## Purpose

Host the deterministic validation gauntlet (Leakage Harness, purged/embargoed CPCV, PBO), the Holdout and Embargo Manager (one-shot, rotating OOS), the Independent Replication Engine, and the Pre-Capital Scientific Gate that issues capital-eligibility tokens.

## Scope

Establishes the governed home for this module's contracts, interfaces, and documentation so
all later construction is compliant by construction. In Phase 0 this directory holds only
scaffolding; implementation lands in the phase noted below under contract-first governance.

## Responsibilities

Hold the contract skeletons, interface placeholders, and documentation for this module.
Adjudication and consequential decisions belong to the deterministic engines
(Architecture V2 §5.6/§6.3) and are never performed here.

## Allowed Contents

Service contract skeleton; API/interface placeholders; module documentation.

## Forbidden Contents

Business logic or algorithms in Phase 0; asset-class branching in a core service (CP-8); data reads outside the As-Of Gateway (PIT-1); any LLM in a decision or execution path (AI-1); hidden cross-service coupling (SE-2).

## Ownership

Accountable role: GRC. Architecture owner: ARB (Architecture V2 §9); every layer has a
named domain lead accountable for conformance.

## Architecture Mapping

Quantitative Engine Layer (Architecture V2 §5.6) — implemented in Phase 4 (Implementation Roadmap, Part C).

## Dependencies

the Trial Ledger; dataset-service (sealed OOS partition). Dependencies flow inward toward stable contracts only (IMP-12, AV2-13); direct
cross-layer access to internals and circular dependencies are PROHIBITED.

## Related Governance Documents

CLAUDE.md; Architecture V2; Implementation Roadmap; RB-01 · STAT; RB-04 · VAL; P2-01..09.
