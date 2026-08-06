# experiments/ — Experiment Artifacts (registry-governed)

> **Phase 0 scaffolding placeholder.** Structure only — no experiment execution.

## Purpose

The governed home for **experiment manifests and their registry metadata**. Every experiment is
registered with an immutable manifest and linked to the Trial Ledger **before** execution
(EX-1, SM-5); every trial — run, discarded, or failed — is counted for multiple-testing control.

## Scope

Experiment registry entries and immutable manifests (definitions only in Phase 0). Pre-
registration of the falsifiable prediction and success criteria is frozen before evaluation.

## Allowed Contents

Experiment manifest skeletons; pre-registration and Trial-Ledger-linkage placeholders;
negative/failed-research corpus structure; documentation.

## Forbidden Contents

Running an experiment without prior registration and a Trial-Ledger entry (FB-5); post-hoc
alteration of success criteria (p-hacking, FB-8); editing a manifest in place (EX-3);
discarding negative results (SM-4).

## Ownership

Accountable role: HR / HQ (with GRC for statistical governance). Architecture owner: ARB.

## Dependencies

Depends on the Research Intelligence Layer and the Trial Ledger / Statistics engine (Phase 4)
for promotion. Scaffolded in **Phase 3**.

## Related Governance Documents

CLAUDE.md (SM-1..5, EX-1..4, SI-1..5); Architecture V2 §5.5/§5.6; RB-01 · STAT; RB-02 · RMET;
Experiment Tracking Governance; P2-01/02.
