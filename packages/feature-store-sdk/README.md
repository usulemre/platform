# @platform/feature-store-sdk

The shared **Feature Store SDK** (Phase 6.6) — the single source of truth for the
Feature Store vocabulary, consumed by both the `feature-store-service` and its
researcher-facing UI.

## Contents

- **Statuses** (`statuses.ts`) — lifecycle, approval, quality, health, validation,
  sync and dependency enums.
- **Capabilities** (`capabilities.ts`) — registration, versioning, discovery,
  search, catalog, metadata, lineage, dependencies, approval status, quality
  status, registry integration.
- **Contracts** (`contracts.ts`) — the canonical models: RegisteredFeature,
  FeatureDefinition, FeatureVersion, FeatureSchema, FeatureDependency,
  FeatureLineage, FeatureOwner, FeatureFamily, FeatureUsage, metadata.
- **Identifiers** (`identifiers.ts`) — pure feature-key and semantic-version
  primitives.

## Boundaries

Vocabulary and pure logic only. **No** feature calculations, **no** statistics,
**no** persistence, **no** caching, **no** database access, **no** transport.
