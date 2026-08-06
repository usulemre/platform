# core-domain · Signal domain

> **Phase 1.1 Core Domain Foundation — pure domain only.** No business logic, no persistence, no
> API, no infrastructure, no AI. Interfaces are placeholders; behavior lives in outer layers.

## Purpose

Model the signal generation lifecycle: net-of-cost, isolation-respecting signals derived from accepted features.

## Responsibilities

Model signal specs and lifecycle (register-before-use, defined retirement); require net-of-cost definition.

## Boundaries

Generates candidates; never adjudicates; never observes validation/OOS outcomes.

## Relationships

Consumes Feature; feeds Strategy; acceptance gated by the deterministic engines. Cross-context references are by identity (shared Ref / typed IDs) only — never by importing
another context's aggregate (SE-2). This module depends only on core_domain.shared.

## Public Interfaces

SignalRepository (append-only); SignalLifecycleService; events SignalGenerated, SignalRetired.

## Forbidden Responsibilities

MUST NOT select on gross performance; MUST NOT observe validation/OOS (isolation barrier); MUST NOT self-accept.

## Dependencies

core_domain.shared (the shared kernel) only. No third-party, framework, or infrastructure deps.

## Related Governance Documents

CLAUDE.md (AD-1..4, RL-2, CP-5); Architecture V2 §5.5; RB-09/10 · FAR; Signal Registry; P2-07.
