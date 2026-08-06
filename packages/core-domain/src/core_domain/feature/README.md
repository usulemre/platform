# core-domain · Feature domain

> **Phase 1.1 Core Domain Foundation — pure domain only.** No business logic, no persistence, no
> API, no infrastructure, no AI. Interfaces are placeholders; behavior lives in outer layers.

## Purpose

Model declarative, point-in-time-bound, leakage-clean, provenance-bearing features and the Feature Marketplace.

## Responsibilities

Model feature specs, acceptance status, leakage reports, and provenance; a feature is accepted only when leakage-clean and provenanced.

## Boundaries

Proposes and structures; acceptance is a deterministic gate (Leakage Harness + significance), not decided here.

## Relationships

Consumes Dataset via the As-Of Gateway; feeds Signal; acceptance gated by the Quantitative Engine Layer. Cross-context references are by identity (shared Ref / typed IDs) only — never by importing
another context's aggregate (SE-2). This module depends only on core_domain.shared.

## Public Interfaces

FeatureRepository (append-only), FeatureMarketplace (read); LeakageHarness; events FeatureProposed, FeatureAccepted.

## Forbidden Responsibilities

MUST NOT accept its own features; MUST NOT use look-ahead/full-sample statistics; MUST NOT exist without provenance.

## Dependencies

core_domain.shared (the shared kernel) only. No third-party, framework, or infrastructure deps.

## Related Governance Documents

CLAUDE.md (FA-1..4, PIT-3, DP-3); Architecture V2 §5.5/§5.8; RB-09/10 · FAR; Feature Registry; P1-06, P2-03.
