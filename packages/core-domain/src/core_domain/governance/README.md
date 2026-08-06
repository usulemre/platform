# core-domain · Governance domain

> **Phase 1.1 Core Domain Foundation — pure domain only.** No business logic, no persistence, no
> API, no infrastructure, no AI. Interfaces are placeholders; behavior lives in outer layers.

## Purpose

Model human accountability: approvals, counter-signatures, capital-eligibility tokens, overrides, and the tamper-evident hash-chained audit trail.

## Responsibilities

Model approvals and overrides (with identity, timestamp, rationale), the canonical capital-eligibility token, and audit-chain entries.

## Boundaries

Humans approve and are accountable; AI may never override a human governance decision; overrides that defeat controls are void.

## Relationships

Approves Execution deployment; issues/holds capital-eligibility tokens referenced by Strategy/Portfolio; records everything in the audit trail. Cross-context references are by identity (shared Ref / typed IDs) only — never by importing
another context's aggregate (SE-2). This module depends only on core_domain.shared.

## Public Interfaces

ApprovalRepository, AuditTrail (append-only); ApprovalEngine, TieredAutonomyPolicy (interfaces); events ProductionDeploymentApproved, OverrideRecorded, GovernanceHalt.

## Forbidden Responsibilities

MUST NOT let AI override a human decision; MUST NOT approve capital without counter-sign; MUST NOT use an override to bypass statistical/risk controls.

## Dependencies

core_domain.shared (the shared kernel) only. No third-party, framework, or infrastructure deps.

## Related Governance Documents

CLAUDE.md (HO-1..4, CP-5/7, SEC-4); Architecture V2 §5.1, §6.2; RB-13 · RISK; ADR Governance; P2-09, P5-05.
