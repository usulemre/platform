# core-domain · Experiment domain

> **Phase 1.1 Core Domain Foundation — pure domain only.** No business logic, no persistence, no
> API, no infrastructure, no AI. Interfaces are placeholders; behavior lives in outer layers.

## Purpose

Model registered experiments with immutable manifests and the append-only Trial Ledger that underpins multiple-testing control.

## Responsibilities

Model experiments, manifests, and trials; require registration and Trial-Ledger enrollment before execution; count every trial.

## Boundaries

Records and structures; it does not compute significance or budgets (that is the Validation domain).

## Relationships

Links Research (hypotheses) to Validation (multiple-testing budget); shares the Trial Ledger with Validation. Cross-context references are by identity (shared Ref / typed IDs) only — never by importing
another context's aggregate (SE-2). This module depends only on core_domain.shared.

## Public Interfaces

ExperimentRepository (append-only), TrialLedger (append-only); ReproducibilityService; events ExperimentRegistered, TrialRecorded.

## Forbidden Responsibilities

MUST NOT run an unregistered experiment; MUST NOT mutate a manifest; MUST NOT let a trial inform a decision uncounted.

## Dependencies

core_domain.shared (the shared kernel) only. No third-party, framework, or infrastructure deps.

## Related Governance Documents

CLAUDE.md (SM-5, EX-1..4, SI-1); Architecture V2 §5.5/§5.6; RB-01 · STAT; Experiment Tracking Governance; P2-01/02.
