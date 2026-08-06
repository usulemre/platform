# signal-service · registry_integration

> **Phase 2.7 Signal Engine — deterministic decision layer, interfaces only.** Deterministic,
> immutable, auditable, traceable. No signal-generation algorithms, no ranking algorithms, no scoring
> formulas, no ML, no portfolio construction, no execution authority, no broker, no persistence, no
> infrastructure, no API. It decides deterministically; it never constructs portfolios or executes.

## Purpose

Define SignalRegistryPort: the integration port to the Signal Registry.

## Responsibilities

Integrate register-before-use, immutable/versioned registration and active publication as an interface; hold no persistence.

## Relationships

Consumed by management; delegates to core_domain.signal repositories and the Signal Registry.

## Dependencies

core_domain.shared (EntityId); model.

## Related Governance Documents

CLAUDE.md (RS-1, CP-2/7, RL-2); Architecture V2 §5.5; RB-09/10 · FAR; Signal Registry.
