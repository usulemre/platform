# datasets/ — Dataset Artifacts (registry-governed)

> **Phase 0 scaffolding placeholder.** Structure only — no data, no ingestion logic.

## Purpose

The governed home for **dataset artifact definitions and their registry metadata** — certified,
point-in-time-correct, provenance-bearing datasets served only through the As-Of Gateway.
Existence and status are governed by the **Dataset Registry / Dataset Governance**.

## Scope

Dataset registry entries, versions, and lineage metadata (definitions only in Phase 0). Every
dataset is immutable, versioned, and register-before-use.

## Allowed Contents

Dataset registry-entry skeletons; schema/lineage placeholders; documentation.

## Forbidden Contents

Raw vendor data or secrets in the repo (FB-14, GIT-5); non-as-of/uncertified data exposure
(PIT-1, DI-1); silently repairing/overwriting source records or vintages (DI-2/3).

## Ownership

Accountable role: HD. Architecture owner: ARB.

## Dependencies

Served exclusively via the Data Platform Layer / As-Of Gateway (`services/dataset-service`,
`packages/data-sdk`). Built in **Phase 2**.

## Related Governance Documents

CLAUDE.md (DI-1..3, DP-1..3, PIT-1..4); Architecture V2 §5.8; RB-06/07 · DATA; RB-08 · PIT;
Dataset Governance; P1-01.
