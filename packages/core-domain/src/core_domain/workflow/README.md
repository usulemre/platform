# core-domain · Workflow domain

> **Phase 1.1 Core Domain Foundation — pure domain only.** No business logic, no persistence, no
> API, no infrastructure, no AI. Interfaces are placeholders; behavior lives in outer layers.

## Purpose

Model the states, transitions, and gates through which all critical work moves; workflows orchestrate and never adjudicate.

## Responsibilities

Model the universal state machine, declared transitions with pre/postconditions, gate results, and the immutable run ledger.

## Boundaries

Orchestrates only; every gate delegates to its owning deterministic engine or human; no completion without the mandatory gate; no stage-skipping.

## Relationships

Coordinates Agents, deterministic engines, and Governance; realizes the staged research-to-production chain. Cross-context references are by identity (shared Ref / typed IDs) only — never by importing
another context's aggregate (SE-2). This module depends only on core_domain.shared.

## Public Interfaces

WorkflowInstanceRepository, RunLedger; WorkflowEngine, GateEvaluator, Compensator (interfaces); events WorkflowStarted, StageTransitioned, WorkflowCompleted, WorkflowEscalated.

## Forbidden Responsibilities

MUST NOT contain decision logic; MUST NOT permit undeclared transitions; MUST NOT skip a gate; MUST NOT leave inconsistent state on failure.

## Dependencies

core_domain.shared (the shared kernel) only. No third-party, framework, or infrastructure deps.

## Related Governance Documents

CLAUDE.md (WCON-1..3, RE-1); Architecture V2 §5.4; Workflow Contracts (Tier-5); P5-05.
