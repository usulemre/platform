# features/ — Feature Artifacts (registry-governed)

> **Phase 0 scaffolding placeholder.** Structure only — no feature computation.

## Purpose

The governed home for **feature definitions and their registry metadata** — declaratively
defined, PIT-bound, leakage-clean, provenance-bearing features in the Feature Marketplace.
Governed by the **Feature Registry**.

## Scope

Feature registry entries and versions (definitions only in Phase 0). A feature is accepted only
after passing the leakage harness and carrying full provenance and a Run Manifest (FA-1..4).

## Allowed Contents

Declarative feature-definition skeletons; provenance/manifest placeholders; documentation.

## Forbidden Contents

Feature computation outside the as-of path (FA-1, PIT-3); full-sample/look-ahead statistics
(FB-7); a feature without provenance (FB-11); mutating an accepted feature (FA-4).

## Ownership

Accountable role: HD / HQ. Architecture owner: ARB.

## Dependencies

Depends on the Data Platform Layer (Feature Factory, As-Of Gateway) and the Leakage Harness;
acceptance gated by the deterministic engines. Scaffolded in **Phase 3** (data side Phase 2).

## Related Governance Documents

CLAUDE.md (FA-1..4, PIT-3, DP-3); Architecture V2 §5.5/§5.8; RB-09/10 · FAR; Feature Registry;
P1-06, P2-03.
