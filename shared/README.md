# shared/ — Shared Kernel (ubiquitous language)

> **Phase 0 scaffolding placeholder.** Definitions only — no behavior.

## Purpose

The **shared kernel**: the platform's ubiquitous language and shared definitions that every
layer depends on and none owns — the ontologies (factor/feature), shared vocabulary, enums, and
value-object definitions used to keep names and meaning consistent (KM-3, NM-1).

## Scope

Technology-independent definitions and vocabularies only. This is distinct from `packages/`
(reusable **libraries/behavior**) and `contracts/` (interface **schemas**); `shared/` holds the
shared **meaning** those depend on.

## Members

- `ontologies/` — factor and feature ontologies (the shared classification vocabulary).
- `vocabulary/` — the ubiquitous language / glossary of domain terms.
- `enums/` — shared enumerations and value-object definitions.

## Allowed Contents

Ontology, vocabulary, and enumeration definition skeletons; documentation.

## Forbidden Contents

Behavior, business logic, or algorithms; asset-class-specific names in the core (NM-4, CP-8);
duplication of contract schemas (owned by `contracts/`).

## Ownership

Accountable role: ARB / PE (with domain leads for their ontologies). Architecture owner: ARB.

## Dependencies

Depends on nothing (innermost kernel). `contracts/`, `packages/`, and services depend on it.

## Related Governance Documents

CLAUDE.md (KM-1..3, NM-1..4); Architecture V2 §5.5 (ontologies); Implementation Roadmap.
