/**
 * Infrastructure INTERFACES (ports) for the research service. The application and
 * domain layers depend only on these abstractions; concrete adapters are injected
 * at composition time. NO implementation here: no persistence, no broker, no
 * provider, no direct infrastructure access. Other modules (datasets, features,
 * signals, strategies, portfolios, market data, workspace) are reached through
 * these abstractions by reference only.
 */
import type {
  ArtifactKind,
  ResearchProject,
  ResearchStage,
  ResearchTemplate,
} from '@platform/research-sdk';

/* ----------------------------- read models ----------------------------- */

export interface ProjectQueryPort {
  list(): Promise<readonly ResearchProject[]>;
  getById(id: string): Promise<ResearchProject | null>;
}

export interface TemplateQueryPort {
  list(): Promise<readonly ResearchTemplate[]>;
  getById(id: string): Promise<ResearchTemplate | null>;
}

/* --------------------------- integration ports -------------------------- */

/** A reference to an artifact owned by another module (dataset/feature/…). */
export interface ModuleArtifactHandle {
  readonly kind: ArtifactKind;
  readonly ref: string;
  readonly name: string;
}

/** Integrates with the Dataset/Feature/Signal/Strategy/Portfolio/Experiment and
 *  Market Data modules by listing available artifact references only. */
export interface ModuleArtifactPort {
  listArtifacts(kind: ArtifactKind): Promise<readonly ModuleArtifactHandle[]>;
}

/** Research Workspace integration — a link/summary handle, never shared state. */
export interface WorkspaceHandle {
  readonly href: string;
  readonly pinnedProjects: number;
}

export interface WorkspacePort {
  getWorkspace(): Promise<WorkspaceHandle>;
}

/* --------------------------- foundation ports --------------------------- */

/** Validation Foundation — whether a gate stage has cleared (decided elsewhere). */
export interface ValidationPort {
  isGateCleared(projectId: string, stage: ResearchStage): Promise<boolean>;
}

/** Workflow Engine — schedule/orchestrate a stage. */
export interface WorkflowPort {
  scheduleStage(projectId: string, stage: ResearchStage): Promise<void>;
}

export interface ResearchEvent {
  readonly id: string;
  readonly projectId: string;
  readonly type: 'STAGE_ADVANCED' | 'APPROVAL_REQUESTED' | 'REVIEW_REQUESTED' | 'SESSION_LOGGED';
  readonly message: string;
  readonly stage?: ResearchStage;
  readonly occurredAt: string;
}

/** Event & Messaging Foundation — publish only; no broker implementation. */
export interface EventBusPort {
  publish(event: ResearchEvent): Promise<void>;
}

/** Configuration Foundation — read-only, non-secret configuration by key. */
export interface ConfigurationPort {
  get(key: string): string | undefined;
}
