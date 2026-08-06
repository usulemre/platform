/**
 * @platform/feature-store-sdk — the shared Feature Store SDK.
 *
 * The single source of truth for the Feature Store *vocabulary*: lifecycle /
 * approval / quality / health / validation / sync statuses, the store
 * capabilities, the canonical models (RegisteredFeature, FeatureDefinition,
 * FeatureVersion, FeatureMetadata, FeatureSchema, FeatureDependency,
 * FeatureLineage, FeatureOwner, FeatureFamily, FeatureUsage, …), and pure
 * identifier/version primitives. Consumed by both the feature-store service and
 * its researcher-facing UI.
 *
 * It contains NO feature calculations, NO statistics, NO persistence, NO caching,
 * NO database access, and NO transport.
 */
export * from './statuses';
export * from './capabilities';
export * from './contracts';
export * from './identifiers';
