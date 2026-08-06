# signal-service · management

> **Phase 2.7 Signal Engine — deterministic decision layer, interfaces only.** Deterministic,
> immutable, auditable, traceable. No signal-generation algorithms, no ranking algorithms, no scoring
> formulas, no ML, no portfolio construction, no execution authority, no broker, no persistence, no
> infrastructure, no API. It decides deterministically; it never constructs portfolios or executes.

## Purpose

Define the Signal Engine service interfaces: SignalService (lifecycle), SignalEngineService (deterministic decision gate), SignalCatalogService.

## Responsibilities

Orchestrate the signal lifecycle and gate activation on validation + mandatory Risk approval; deterministic and net-of-cost; hold no portfolio-construction, execution authority, or ML.

## Relationships

Top-level module: composes model, generation, validation/approval/governance, scoring/ranking, registry.

## Dependencies

core_domain.shared (EntityId); decision; metadata.

## Related Governance Documents

CLAUDE.md (AD-1, RS-1, DE-1, AI-1, PS-1); Architecture V2 §5.5, §6.3; RB-09/10 · FAR; RB-13 · RISK; Signal Registry.
