# scripts/ — Operational & Developer Scripts

> **Phase 0 scaffolding placeholder.** Structure only.

## Purpose

Repeatable, auditable developer and operational scripts (setup, checks, generators). Scripts are
part of the auditable build (IMP-7) and MUST NOT embed secrets or bypass governance gates.

## Scope

Automation only. Nothing here makes a consequential decision or touches capital.

## Allowed Contents

Setup/bootstrap, verification, and code-generation script skeletons; documentation.

## Forbidden Contents

Secrets or credentials (SEC-3, CODE-29); ambient production side-effects; anything that
bypasses a governance gate or the release gates.

## Ownership

Accountable role: PE. Architecture owner: ARB.

## Dependencies

May invoke `tools/` and `packages/`; depended on by no runtime component.

## Related Governance Documents

CLAUDE.md (GIT-1..5, SEC-3); RB-20 · CODE; Implementation Roadmap Phase 0.
