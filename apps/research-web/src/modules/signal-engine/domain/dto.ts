/**
 * Signal Engine DTOs. The canonical shapes are owned by the shared
 * `@platform/signal-sdk` (single source of truth across the service and this UI);
 * this module re-exports them so both tiers speak the same vocabulary. Inert data
 * only — no alpha models, no signal calculations, no statistics.
 */
export type {
  ApprovalStatus,
  DependencyKind,
  DependencyStatus,
  HealthStatus,
  LineageNode,
  LineageNodeKind,
  MetadataEntry,
  PromotionStatus,
  QualityGrade,
  RegisteredSignal,
  RegistrySync,
  ReviewStatus,
  SignalApproval,
  SignalDefinition,
  SignalDependency,
  SignalDirection,
  SignalFamily,
  SignalHealth,
  SignalLineage,
  SignalOwner,
  SignalPromotion,
  SignalQuality,
  SignalReview,
  SignalStage,
  SignalUsage,
  SignalValidation,
  SignalVersion,
  SyncStatus,
  ValidationStatus,
} from '@platform/signal-sdk';
