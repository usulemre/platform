/**
 * Feature Store DTOs. The canonical shapes are owned by the shared
 * `@platform/feature-store-sdk` (single source of truth across the service and
 * this UI); this module re-exports them so both tiers speak the same vocabulary.
 * Inert data only — no feature calculations, no statistics.
 */
export type {
  ApprovalStatus,
  DependencyKind,
  DependencyStatus,
  FeatureDefinition,
  FeatureDependency,
  FeatureFamily,
  FeatureHealth,
  FeatureLifecycleStatus,
  FeatureLineage,
  FeatureOwner,
  FeatureQuality,
  FeatureSchema,
  FeatureSchemaField,
  FeatureUsage,
  FeatureValueType,
  FeatureVersion,
  HealthStatus,
  LineageNode,
  LineageNodeKind,
  MetadataEntry,
  QualityGrade,
  RegisteredFeature,
  RegistrySync,
  SyncStatus,
  ValidationStatus,
} from '@platform/feature-store-sdk';
