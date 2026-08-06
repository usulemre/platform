# backtesting-service · reproducibility

> **Phase 2.5 Backtesting Engine — deterministic engine, interfaces only.** Deterministic,
> reproducible, technology-independent, immutable, auditable. No simulation algorithms, no statistical
> calculations, no production execution, no broker/market connectivity, no persistence, no
> infrastructure, no API. It produces reproducible performance EVIDENCE; it never adjudicates.

## Purpose

Define ReproducibilityManager: bind the Run Manifest, verify bit-for-bit reproduction, and enable replay from the manifest.

## Responsibilities

Manage the reproducibility spine (manifest binding, replay, verification); enforce no optimization without reproducibility; hold no persistence.

## Relationships

core_domain.shared (EntityId, RunManifestRef); realizes the reproducibility spine (P1-02).

## Dependencies

Consumed by engine and lifecycle (replay/revalidation).

## Related Governance Documents

CLAUDE.md (RP-1/2, CP-4, EX-2, FB-10); Architecture V2 §5.6, §5.10; RB-05 · REPRO; RB-11 · BT; P1-02.
