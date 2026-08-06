# configs/ — Configuration & Environment Separation

> **Phase 0 scaffolding placeholder.** Structure only — no secrets.

## Purpose

Technology-independent configuration and **environment separation** with a
**secrets-by-reference** model: configuration is declared and versioned; secrets are brokered by
reference and never stored in the repository (SEC-3, CODE-29, FB-14).

## Scope

Configuration schemas and per-environment values (references only). Distinct from
`deployment/` (how the platform is deployed) and `infrastructure/` (what it runs on).

## Members

- `environments/development/`, `environments/staging/`, `environments/production/`
- `schema/` — configuration schema definitions and validation.

## Allowed Contents

Config schema skeletons; non-secret per-environment value placeholders; secret **references**;
documentation.

## Forbidden Contents

Any secret, credential, or token value (FB-14, SEC-3); environment-coupling that prevents
independent promotion; raw vendor data.

## Ownership

Accountable role: PE / HSRE; secrets brokering: CISO. Architecture owner: ARB.

## Dependencies

Consumed by `packages/configuration`; depends on `packages/security` for secret references.

## Related Governance Documents

CLAUDE.md (SEC-1..4, DEP-1); Architecture V2 §6.5; RB-27 · SEC; Implementation Roadmap Phase 0.
