# signals/ — Signal Artifacts (registry-governed)

> **Phase 0 scaffolding placeholder.** Structure only — no signal generation.

## Purpose

The governed home for **signal definitions and their registry metadata** — the signal
generation lifecycle. Governed by the **Signal Registry**.

## Scope

Signal registry entries, versions, and lineage (definitions only in Phase 0). Signals are
register-before-use, immutable, and net-of-cost defined (AD-1).

## Allowed Contents

Signal-definition skeletons; lineage/provenance placeholders; documentation.

## Forbidden Contents

Generation logic in Phase 0; a generator observing per-candidate validation/OOS outcomes
(AD-3, isolation barrier P2-07); gross (pre-cost) selection (AP-10).

## Ownership

Accountable role: HQ. Architecture owner: ARB.

## Dependencies

Depends on `features/` and the deterministic engines that gate acceptance. Scaffolded in
**Phase 3**. Follows features → signal in the research-object chain (IMP-21).

## Related Governance Documents

CLAUDE.md (AD-1..4, CP-5); Architecture V2 §5.5; RB-09/10 · FAR; Signal Registry; P2-07.
