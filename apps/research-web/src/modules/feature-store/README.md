# Feature Store (research-web UI, Phase 6.6)

The researcher-facing interface for the canonical **Feature Store**, inside
`research-web`. It surfaces every approved feature managed by
`services/feature-store-service` and speaks the shared vocabulary from
`@platform/feature-store-sdk`.

## What it is (and is not)

- **Is:** a read-only console over the feature catalog — dashboard, catalog +
  explorer (search/filter/sort), feature details (definition, schema, versions,
  dependencies, lineage, ownership, usage, quality, health, validation status,
  registry synchronization, tags, metadata), and feature families.
- **Is not:** a compute layer. It runs no feature calculations, no statistical
  tests, and contains no business logic in components (formatting/aggregation is
  in the pure mappers/service). It never validates significance, decides approval
  or grades quality — those verdicts are produced by deterministic engines and
  accountable humans and are only reflected here.

## Shared contracts

The canonical models and enums (RegisteredFeature, FeatureDefinition,
FeatureVersion, FeatureSchema, FeatureDependency, FeatureLineage, FeatureOwner,
FeatureFamily, FeatureUsage, and the lifecycle / approval / quality / health /
validation / sync statuses) come from **`@platform/feature-store-sdk`** — the
single source of truth shared with the service tier.

## Layering

```
components / routes  →  hooks  →  application (FeatureStoreAdminService)
                                     →  data (FeatureStoreRepository + Mock/Api)
                                     →  domain (VM / mappers / query, over @platform/feature-store-sdk)
```

Swap `MockFeatureStoreRepository` for `new ApiFeatureStoreRepository(apiClient)`
in `application/container.ts` (over the feature-store service gateway) to go live
— no hook/service/UI change.

## Routes

`/feature-store` (dashboard + catalog/explorer, with loading + error),
`/feature-store/[featureId]` (details), `/feature-store/families`. A nav entry and
a "Go to Feature store" command are wired into research-web; dependencies and
lineage deep-link into the datasets and features modules.
