# core-domain · shared kernel

> **Phase 1.1 — pure domain primitives.** No business logic, no infrastructure.

## Purpose

The shared kernel every bounded context depends on: identities (content-addressed / versioned),
bitemporal time, the authority spine (propose/narrate/decide/approve), provenance, and the base
patterns (Entity, AggregateRoot, DomainEvent, Repository, Specification, Policy, Factory,
DomainService) and the canonical domain errors.

## Boundaries

Depends on nothing (innermost). All domain modules depend on it; it depends on no domain module.
No ambient time/RNG (time is a value object supplied by an injected clock).

## Related Governance Documents

CLAUDE.md (CP-2/4/5/6/7/8, NM-2, PIT-1..4, CS-3); Architecture V2 §4, §5.10; RB-20 · CODE; TDR §4.
