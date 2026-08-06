# strategies/ — Strategy Artifacts (registry-governed)

> **Phase 0 scaffolding placeholder.** Structure only — no strategy logic.

## Purpose

The governed home for **strategy definitions and their registry metadata** — the strategy
lifecycle, including a defined death (retirement), not only a birth (RL-2). Governed by the
**Strategy Registry**.

## Scope

Strategy registry entries, versions, and lifecycle state (definitions only in Phase 0).

## Allowed Contents

Strategy-definition skeletons; lifecycle/retirement placeholders; documentation.

## Forbidden Contents

Business logic/algorithms in Phase 0; consuming non-eligible alphas (PS-1); any promotion
without the scientific governance gate and independent replication (FC-5, RG-1).

## Ownership

Accountable role: HQ / HPR. Architecture owner: ARB.

## Dependencies

Depends on `signals/` and the deterministic engines (validation, backtest) that gate it.
Scaffolded in **Phase 3**; promotion enabled only after the First-Capital Gate (IMP-18).

## Related Governance Documents

CLAUDE.md (RL-1/2, FC-1..5, RG-1..3); Architecture V2 §5.5/§5.6; Strategy Registry; P2-08/09.
