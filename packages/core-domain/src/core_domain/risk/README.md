# core-domain · Risk domain

> **Phase 1.1 Core Domain Foundation — pure domain only.** No business logic, no persistence, no
> API, no infrastructure, no AI. Interfaces are placeholders; behavior lives in outer layers.

## Purpose

Model independent, deterministic risk limits and assessments and the human-invocable kill-switch that can halt anything.

## Responsibilities

Model limits, exposures, breaches, verdicts, and kill-switch state; risk sign-off is independent of research and portfolio.

## Boundaries

Deterministic and independent; the kill-switch is human-invocable and never AI-gated; overrides the first line.

## Relationships

Assesses Portfolio and Strategy; halts Execution; independent of research/portfolio (CP-5). Cross-context references are by identity (shared Ref / typed IDs) only — never by importing
another context's aggregate (SE-2). This module depends only on core_domain.shared.

## Public Interfaces

RiskLimitRepository, RiskAssessmentRepository; RiskLimitEngine, KillSwitch (interfaces); events RiskValidated, LimitBreached, KillSwitchEngaged.

## Forbidden Responsibilities

MUST NOT be overridden by the first line; MUST NOT delegate halts to AI; MUST NOT report to research.

## Dependencies

core_domain.shared (the shared kernel) only. No third-party, framework, or infrastructure deps.

## Related Governance Documents

CLAUDE.md (RS-1..4, CP-5, HO-4); Architecture V2 §5.7; RB-13 · RISK; P1-03, P6-03.
