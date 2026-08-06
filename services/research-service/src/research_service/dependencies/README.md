# research-service · dependencies

> **Phase 2.1 Research Service — institutional research model, interfaces only.** Deterministic,
> technology-independent, immutable, auditable. No statistical algorithms, no backtesting, no AI,
> no persistence, no infrastructure, no API, no UI. It proposes and records; it never adjudicates.

## Purpose

Define ResearchDependency and DependencyKind: declared links from a research initiative to datasets, features, experiments, validation, and prior research.

## Responsibilities

Represent cross-context dependencies by identity only; declare all dependencies explicitly; never create an isolation-barrier-breaching channel; hold no logic.

## Relationships

Consumed by management; connects to Dataset/Feature/Experiment/Validation by reference.

## Dependencies

core_domain.shared (Ref); standard library.

## Related Governance Documents

CLAUDE.md (SE-2, AC-1/3, AD-3); Architecture V2 §5.5, §6.1; RB-02 · RMET; P2-07.
