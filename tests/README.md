# tests/ — Cross-Cutting Test Suites

> **Phase 0 scaffolding placeholder.** Structure only — no tests yet.

## Purpose

Cross-cutting and system-level test suites that enforce the platform's guarantees:
golden-set tests for deterministic decision engines (CS-2, VS-1), conformance tests for
governance invariants, and integration/e2e tests across bounded contexts. Module-local unit
tests live beside their code.

## Scope

Tests that span more than one module, plus the golden and conformance suites that must never
regress. Every deliverable must be testable in isolation (IMP-6).

## Members

- `unit/` — shared unit-test scaffolding/fixtures.
- `integration/` — cross-service/contract integration tests.
- `golden/` — golden-set tests for deterministic engines (hard gate).
- `conformance/` — Architecture V2 / rulebook invariant conformance tests.
- `e2e/` — end-to-end staged-chain tests.

## Allowed Contents

Test scaffolding, fixtures, and harness placeholders; documentation.

## Forbidden Contents

Non-deterministic tests of decision engines; tests that read non-as-of data; fixtures
containing secrets or raw vendor data.

## Ownership

Accountable role: PE. Architecture owner: ARB.

## Dependencies

Depends on the modules under test via their contracts; depended on by CI quality gates.

## Related Governance Documents

CLAUDE.md (CS-2, VS-1, CR-2); Architecture V2 §12 (conformance); RB-21 · TEST; Implementation
Roadmap Part F (quality gates).
