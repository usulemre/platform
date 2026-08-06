# core-domain · Portfolio domain

> **Phase 1.1 Core Domain Foundation — pure domain only.** No business logic, no persistence, no
> API, no infrastructure, no AI. Interfaces are placeholders; behavior lives in outer layers.

## Purpose

Model immutable, rationale-bearing portfolio snapshots produced by a deterministic, net-of-cost optimizer from capital-eligible alphas.

## Responsibilities

Model allocations, weights, constraints, and rationale; every portfolio is an immutable, content-addressed snapshot.

## Boundaries

Consumes only eligible alphas; never re-adjudicates whether a signal is real; the optimizer is deterministic.

## Relationships

Consumes Strategy (eligible) and Risk limits; feeds Execution. Cross-context references are by identity (shared Ref / typed IDs) only — never by importing
another context's aggregate (SE-2). This module depends only on core_domain.shared.

## Public Interfaces

PortfolioRepository (append-only); PortfolioOptimizer (deterministic interface); event PortfolioConstructed.

## Forbidden Responsibilities

MUST NOT optimize on gross returns; MUST NOT let an LLM decide allocation/sizing; MUST NOT consume ineligible alphas.

## Dependencies

core_domain.shared (the shared kernel) only. No third-party, framework, or infrastructure deps.

## Related Governance Documents

CLAUDE.md (PS-1..4, AI-1); Architecture V2 §5.6; RB-12 · PORT; Portfolio Registry; P1-08.
