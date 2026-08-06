# agents/ — AI Agents (registered, contract-bound)

> **Phase 0 scaffolding placeholder.** Directory structure only — agents are **NOT** implemented
> here. Agent implementation lands in **Phase 5**, only after the deterministic core (Phase 4)
> exists for them to defer to (IMP-3, IMP-19).

## Purpose

House the single-responsibility AI agents that **propose** and **narrate** at the fuzzy edges.
Every agent is `propose`- or `narrate`-only; **no agent holds decision authority** (AV2-17).
The concrete roster is the authoritative **AI Agent Registry**; each entry references a
Tier-4 Agent Contract that governs the full specification.

## Scope

One directory per registry category, one sub-directory per registered agent (`AGT-<CAT>-<nnn>`).
An unregistered agent does not exist for operational purposes and MUST NOT run (REG-1).

## Members (by category)

research-discovery (RD) · feature-discovery (FD) · analysis (AN) · validation-narrator (VN) ·
risk-narrator (RN) · portfolio-narrator (PN) · documentation (DO) · engineering (EN) ·
monitoring-narrator (MO).

## Allowed Contents

Per-agent documentation pointing to the registry entry and Tier-4 contract; interface
placeholders for the (Phase 5) agent runtime binding.

## Forbidden Contents

Any decision/approval/execution logic (AI-1..4); OOS/holdout access for generation agents
(AI-5, isolation barrier P2-07); self-modifying contracts or self-escalation (REG-22/23);
implementation before Phase 4 is complete (IMP-19).

## Ownership

Accountable role: HAI (registry system); each agent has a named human owner (see registry).
Architecture owner: ARB.

## Dependencies

Depends on `packages/ai-runtime` and the deterministic engines it narrates/defers to.
Generators and any validation/OOS channel MUST NOT communicate (AC-3, isolation barrier).

## Related Governance Documents

CLAUDE.md (AI-1..8, AG-1..4); Architecture V2 §5.3; RB-15 · AIGOV; Agent Registry; Agent
Contracts (Tier-4); AI Agent Evaluation Framework; Implementation Roadmap Phase 5.
