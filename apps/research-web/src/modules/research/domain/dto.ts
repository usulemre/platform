/**
 * Research Engine admin DTOs. The canonical shapes are owned by the shared
 * `@platform/research-sdk` (single source of truth across the service and this
 * UI); this module re-exports them so both tiers speak the same vocabulary. Inert
 * data only — no quantitative algorithms, no statistics.
 */
export type {
  ApprovalStatus,
  ArtifactKind,
  DependencyStatus,
  MetadataEntry,
  MilestoneStatus,
  ObjectiveStatus,
  ProgressInfo,
  ProjectStatus,
  ResearchApproval,
  ResearchArtifact,
  ResearchCapability,
  ResearchDependency,
  ResearchHypothesis,
  ResearchMilestone,
  ResearchNotebook,
  ResearchObjective,
  ResearchProject,
  ResearchQuestion,
  ResearchReview,
  ResearchSession,
  ResearchStage,
  ResearchTemplate,
  ReviewStatus,
  StageProgress,
  StageState,
} from '@platform/research-sdk';
