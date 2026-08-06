# @platform/signal-sdk

The shared **Signal Engine SDK** (Phase 6.7) — the single source of truth for the
Signal Engine vocabulary, consumed by both the `signal-engine-service` and its
researcher-facing UI.

## Contents

- **Stages** (`stages.ts`) — the 7-stage signal research lifecycle (candidate →
  research → validation → review → approval → registry → production candidate),
  with gate flags and pure ordering (`describeStage`, `stageOrder`, `nextStage`).
- **Statuses** (`statuses.ts`) — validation, approval, review, promotion, quality,
  health, sync and dependency enums.
- **Capabilities** (`capabilities.ts`) — registration, versioning, review,
  approval, promotion, discovery, search, catalog, metadata, dependencies,
  lineage, registry integration.
- **Contracts** (`contracts.ts`) — the canonical models: RegisteredSignal,
  SignalDefinition, SignalVersion, SignalDependency, SignalLineage,
  SignalValidation, SignalApproval, SignalReview, SignalPromotion, SignalFamily,
  SignalOwner, SignalUsage, SignalSnapshot, metadata.
- **Identifiers** (`identifiers.ts`) — pure signal-key and semantic-version
  primitives.

## Boundaries

Vocabulary and pure logic only. **No** alpha models, **no** signal calculations,
**no** statistics, **no** ML, **no** persistence, **no** caching, **no** database
access, **no** transport.
