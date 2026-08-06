# core-domain · Research domain

> **Phase 1.1 Core Domain Foundation — pure domain only.** No business logic, no persistence, no
> API, no infrastructure, no AI. Interfaces are placeholders; behavior lives in outer layers.

## Purpose

Produce and manage the research lifecycle scaffolding: registered ideas and pre-registered, falsifiable hypotheses with economic rationale.

## Responsibilities

Model ideas and hypotheses; carry immutable pre-registration; require a falsifiable prediction and success criteria before evaluation.

## Boundaries

Produces candidates and descriptive structure only; it does NOT adjudicate significance or acceptance (that is the Validation domain / Quantitative Engine Layer).

## Relationships

Feeds Experiment, Feature, and Signal domains; isolated from Validation outcomes (isolation barrier). Cross-context references are by identity (shared Ref / typed IDs) only — never by importing
another context's aggregate (SE-2). This module depends only on core_domain.shared.

## Public Interfaces

IdeaRepository, HypothesisRepository (append-only); PreRegistrationService (interface); events ResearchCreated, HypothesisPreRegistered.

## Forbidden Responsibilities

MUST NOT validate its own output; MUST NOT access OOS/validation results; MUST NOT alter pre-registration after lock.

## Dependencies

core_domain.shared (the shared kernel) only. No third-party, framework, or infrastructure deps.

## Related Governance Documents

CLAUDE.md (SM-1..5, AD-2/3, EXP-1); Architecture V2 §5.5; RB-02 · RMET; Experiment Tracking Governance; P3-02.
