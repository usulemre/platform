# signal-engine-service (Phase 6.7)

The canonical **Signal Engine** — the orchestration layer for the quantitative
trading signal lifecycle. It transforms approved features into validated signal
definitions through a governed research workflow and manages signal metadata,
lineage, dependencies, versioning, validation status, review, approval and
promotion.

## Signal lifecycle

```
Candidate → Research → Validation → Review → Approval → Signal Registry → Production Candidate
```

Validation, Review and Approval are **gate** stages: the transition is decided by
the Validation Foundation and accountable humans, never by this engine.

## What it is (and is not)

- **Is:** an orchestration + catalog service over the signal lifecycle. It exposes
  the engine capabilities (registration, versioning, review, approval, promotion,
  discovery, search, catalog, metadata, dependencies, lineage, registry
  integration) through a pure domain layer and an application layer.
- **Is not:** a compute or storage layer. It implements **no** alpha models,
  **no** signal calculations, **no** statistics, **no** ML inference, and holds
  **no** persistence, caching or database access. It never communicates with
  exchanges. It never decides validation significance, approval or quality — those
  verdicts are produced by the Validation Foundation and governance (CP-5); the
  engine only reflects and reroutes them.

## Shared contracts

The canonical models and vocabularies (RegisteredSignal, SignalDefinition,
SignalVersion, SignalDependency, SignalLineage, SignalValidation, SignalApproval,
SignalReview, SignalPromotion, SignalFamily, SignalOwner, SignalUsage,
SignalSnapshot, the 7 lifecycle stages, and the validation / approval / review /
promotion / quality / health / sync statuses) come from **`@platform/signal-sdk`**
— the single source of truth shared with the researcher-facing UI.

## Layering

```
application (SignalEngineService)
  → domain (discovery/search + lifecycle rules + derivations, over @platform/signal-sdk)
  → infrastructure ports (Signal/Family query · Discovery · FeatureStore ·
    Registry · Validation · Workflow · EventBus · Configuration)
```

Only **interfaces** touch infrastructure; concrete adapters are bound in
`composition.ts`. In v1 the only adapters are in-memory mocks — swapping in real
adapters requires no application/domain change.

## Integrations (by reference only)

Research Engine · Feature Store · Feature Discovery Engine · Signal Registry ·
Validation Foundation · Workflow Engine · Configuration Foundation · Event &
Messaging Foundation · Market Data Platform. The service never accesses
infrastructure directly, never talks to an exchange, and never branches on asset
class.
