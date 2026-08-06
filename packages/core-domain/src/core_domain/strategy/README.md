# core-domain · Strategy domain

> **Phase 1.1 Core Domain Foundation — pure domain only.** No business logic, no persistence, no
> API, no infrastructure, no AI. Interfaces are placeholders; behavior lives in outer layers.

## Purpose

Model the strategy lifecycle, including a defined retirement (RL-2), and the reference to its capital-eligibility token.

## Responsibilities

Model strategy versions, lifecycle state, and eligibility reference; require the scientific gate and replication before capital.

## Boundaries

Structures the lifecycle; does not adjudicate eligibility (the Validation domain / scientific gate does).

## Relationships

Consumes Signal; references governance-issued capital-eligibility tokens; feeds Portfolio. Cross-context references are by identity (shared Ref / typed IDs) only — never by importing
another context's aggregate (SE-2). This module depends only on core_domain.shared.

## Public Interfaces

StrategyRepository (append-only); StrategyLifecycleService; events StrategyRegistered, StrategyApproved, StrategyRetired.

## Forbidden Responsibilities

MUST NOT consume capital without an eligibility token; MUST NOT promote without replication and the scientific gate.

## Dependencies

core_domain.shared (the shared kernel) only. No third-party, framework, or infrastructure deps.

## Related Governance Documents

CLAUDE.md (RL-1/2, FC-1..5, RG-1..3); Architecture V2 §5.5/§5.6; Strategy Registry; P2-08/09.
