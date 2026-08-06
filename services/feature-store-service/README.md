# feature-store-service (Phase 6.6)

The canonical **Feature Store** — the single source of truth for every approved
feature. It manages feature lifecycle, versioning, metadata, lineage,
dependencies and discovery, and provides reusable feature access across research,
backtesting, signal generation and production execution.

## What it is (and is not)

- **Is:** an orchestration + catalog service over approved features. It exposes
  the store capabilities (registration, versioning, discovery, search, catalog,
  metadata, lineage, dependencies, approval status, quality status, registry
  integration) through a pure domain layer and an application layer.
- **Is not:** a compute or storage layer. It runs **no** feature calculations,
  **no** statistics, and holds **no** persistence, caching or database access. It
  never decides approval, validation significance or quality verdicts — those are
  produced by the Validation Foundation and governance (CP-5); the store only
  reflects and reroutes them.

## Shared contracts

The canonical models and vocabularies (RegisteredFeature, FeatureDefinition,
FeatureVersion, FeatureSchema, FeatureDependency, FeatureLineage, FeatureOwner,
FeatureFamily, FeatureUsage, and the lifecycle / approval / quality / health /
validation / sync statuses) come from **`@platform/feature-store-sdk`** — the
single source of truth shared with the researcher-facing UI.

## Layering

```
application (FeatureStoreService)
  → domain (discovery/search + derivations, over @platform/feature-store-sdk)
  → infrastructure ports (FeatureQuery / Family / Discovery / Registry /
    Validation / Workflow / EventBus / Configuration)
```

Only **interfaces** touch infrastructure; concrete adapters are bound in
`composition.ts`. In v1 the only adapters are in-memory mocks — swapping in real
adapters requires no application/domain change.

## Integrations (by reference only)

Feature Discovery Engine · Feature Registry · Validation Foundation · Workflow
Engine · Configuration Foundation · (consumed by) Research / Signal / Backtesting
engines and the Market Data Platform. The service never accesses infrastructure
directly and never branches on asset class.
