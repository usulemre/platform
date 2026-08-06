# Backtesting Workflow (WFC-45)

> **Phase 0 scaffolding placeholder — structure only.** No business logic, no quantitative
> algorithms, no application code (Implementation Roadmap, Phase 0).

## Purpose

Orchestrate configuration and execution of the deterministic backtest engine and capture of its immutable artifact.

## Scope

Establishes the governed home for this module's contracts, interfaces, and documentation so
all later construction is compliant by construction. In Phase 0 this directory holds only
scaffolding; implementation lands in the phase noted below under contract-first governance.

## Responsibilities

Hold the contract skeletons, interface placeholders, and documentation for this module.
Adjudication and consequential decisions belong to the deterministic engines
(Architecture V2 §5.6/§6.3) and are never performed here.

## Allowed Contents

Versioned workflow-definition skeleton; state/transition/gate placeholders; documentation.

## Forbidden Contents

Decision logic embedded in the workflow (WCON-2); undeclared transitions or stage-skipping (WFC-16); moving research directly to production (WFC-3); an AI approving its own output (WFC-27).

## Ownership

Accountable role: HQ. Architecture owner: ARB (Architecture V2 §9); every layer has a
named domain lead accountable for conformance.

## Architecture Mapping

Workflow Control Layer (Architecture V2 §5.4) — implemented in Phase 6 (Implementation Roadmap, Part C).

## Dependencies

backtesting-service. Dependencies flow inward toward stable contracts only (IMP-12, AV2-13); direct
cross-layer access to internals and circular dependencies are PROHIBITED.

## Related Governance Documents

CLAUDE.md; Architecture V2; Implementation Roadmap; Workflow Contracts (WFC-45); RB-11 · BT.
