# deployment/ — Deployment & Release

> **Phase 0 scaffolding placeholder.** Structure only.

## Purpose

Technology-independent definitions for how the platform is released and rolled out —
**paper-first by default**, live only through a governance authorization token and the release
gates (DEP-1..4). Deployment is reversible (DEP-3).

## Scope

Release/rollout definitions, environment promotion, and rollback. Distinct from
`infrastructure/` (the substrate) and `configs/` (values). Built in **Phase 8**.

## Allowed Contents

Release/rollout and rollback definition skeletons; environment-promotion placeholders;
documentation of the First-Capital and Live-Capital gates.

## Forbidden Contents

Any path to live capital that bypasses the release gates (IMP-29, FB-12); irreversible
deployment (DEP-3); AI authorizing execution/deployment (AI-1..4).

## Ownership

Accountable role: HSRE / HPR; capital-affecting releases require GRC human sign-off. Architecture
owner: ARB.

## Dependencies

Depends on all prior phases and the deterministic core; gated by the Patch Plan §5 release gates.

## Related Governance Documents

CLAUDE.md (DEP-1..4, RS-4, HO-2); Architecture V2 §5.9; RB-30 · DEPLOY; Execution Governance;
Implementation Roadmap Phase 8 / IMP-29.
