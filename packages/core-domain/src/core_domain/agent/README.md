# core-domain · Agent domain

> **Phase 1.1 Core Domain Foundation — pure domain only.** No business logic, no persistence, no
> API, no infrastructure, no AI. Interfaces are placeholders; behavior lives in outer layers.

## Purpose

Model registered, contract-bound, advisory-only AI agents: registry entries, model pins, prompt versions, and authority ceilings.

## Responsibilities

Model agent registration, trust level, lifecycle state, model pin, and outputs; every agent is propose/narrate only and model-pinned.

## Boundaries

AI is advisory; no agent holds decision authority; agents cannot edit their own entry or escalate authority; generators cannot access OOS/validation.

## Relationships

Mirrors the AI Agent Registry; participates in Workflows; defers to the deterministic engines it narrates. Cross-context references are by identity (shared Ref / typed IDs) only — never by importing
another context's aggregate (SE-2). This module depends only on core_domain.shared.

## Public Interfaces

AgentRegistryPort, ModelRegistryPort; AgentAuthorityPolicy, IsolationPolicy (interfaces); events AgentCertified, AgentSuspended, AgentOutputRecorded.

## Forbidden Responsibilities

MUST NOT hold or attempt decide authority; MUST NOT self-edit/self-escalate; MUST NOT run an unpinned model; MUST NOT breach isolation.

## Dependencies

core_domain.shared (the shared kernel) only. No third-party, framework, or infrastructure deps.

## Related Governance Documents

CLAUDE.md (AI-1..8, AG-1..4); Architecture V2 §5.3; RB-15 · AIGOV; Agent Registry; Agent Contracts; P4-01/02, P2-07.
