# core-domain · Validation domain

> **Phase 1.1 Core Domain Foundation — pure domain only.** No business logic, no persistence, no
> API, no infrastructure, no AI. Interfaces are placeholders; behavior lives in outer layers.

## Purpose

Model the deterministic validation gauntlet, one-shot holdout, independent replication, and the Pre-Capital Scientific Gate that issues capital-eligibility tokens.

## Responsibilities

Model verdicts, deflated metrics, PBO, holdout allocations, and replication; every decision is deterministic and golden-tested.

## Boundaries

This is the ONLY place significance/validation/promotion is adjudicated; no LLM is ever in the path; the platform runs it with all AI suspended.

## Relationships

Consumes Experiment (Trial Ledger) and Dataset (sealed OOS); issues tokens consumed by Strategy/Governance; firewalled from Research generation. Cross-context references are by identity (shared Ref / typed IDs) only — never by importing
another context's aggregate (SE-2). This module depends only on core_domain.shared.

## Public Interfaces

ValidationRunRepository; MultipleTestingEnforcer, ValidationGauntlet, HoldoutEmbargoManager, ReplicationEngine, ScientificGate (interfaces); events ValidationCompleted, HoldoutConsumed, CapitalEligibilityIssued.

## Forbidden Responsibilities

MUST NOT let an LLM assert significance/verdict; MUST NOT reuse OOS iteratively; MUST NOT present undeflated significance; MUST NOT expose OOS to generators.

## Dependencies

core_domain.shared (the shared kernel) only. No third-party, framework, or infrastructure deps.

## Related Governance Documents

CLAUDE.md (SI-1..5, VS-1..4, AI-2/3); Architecture V2 §5.6, §6.3; RB-01 · STAT; RB-04 · VAL; P2-01..09.
