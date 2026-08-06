/**
 * Research application service — the orchestration surface of the Research
 * Engine. It coordinates the research lifecycle across the other modules through
 * ports only; it holds no infrastructure, no quantitative algorithms, no
 * statistics, no persistence. Lifecycle advancement is a pure domain decision;
 * governance approvals and validation verdicts are decided elsewhere (CP-5).
 */
import type {
  ArtifactKind,
  ProgressInfo,
  ResearchMetrics,
  ResearchProject,
  ResearchStage,
  ResearchTemplate,
  StageProgress,
} from '@platform/research-sdk';
import { ResearchProjectAggregate } from '../domain/research-project';
import type {
  ConfigurationPort,
  EventBusPort,
  ModuleArtifactHandle,
  ModuleArtifactPort,
  ProjectQueryPort,
  TemplateQueryPort,
  ValidationPort,
  WorkflowPort,
  WorkspaceHandle,
  WorkspacePort,
} from '../infrastructure/ports';

export interface ResearchSummary {
  readonly totalProjects: number;
  readonly active: number;
  readonly blocked: number;
  readonly completed: number;
  readonly awaitingApproval: number;
  readonly byStage: readonly { readonly stage: ResearchStage; readonly count: number }[];
}

export interface AdvanceOutcome {
  readonly projectId: string;
  readonly advancedTo: ResearchStage | null;
  readonly stages: readonly StageProgress[];
  readonly changed: boolean;
}

export interface ResearchServiceDeps {
  readonly projects: ProjectQueryPort;
  readonly templates: TemplateQueryPort;
  readonly artifacts: ModuleArtifactPort;
  readonly workspace: WorkspacePort;
  readonly validation: ValidationPort;
  readonly workflow: WorkflowPort;
  readonly bus: EventBusPort;
  readonly config: ConfigurationPort;
}

export class ResearchService {
  constructor(private readonly deps: ResearchServiceDeps) {}

  listProjects(): Promise<readonly ResearchProject[]> {
    return this.deps.projects.list();
  }

  getProject(id: string): Promise<ResearchProject | null> {
    return this.deps.projects.getById(id);
  }

  listTemplates(): Promise<readonly ResearchTemplate[]> {
    return this.deps.templates.list();
  }

  getTemplate(id: string): Promise<ResearchTemplate | null> {
    return this.deps.templates.getById(id);
  }

  listModuleArtifacts(kind: ArtifactKind): Promise<readonly ModuleArtifactHandle[]> {
    return this.deps.artifacts.listArtifacts(kind);
  }

  getWorkspace(): Promise<WorkspaceHandle> {
    return this.deps.workspace.getWorkspace();
  }

  async getProgress(id: string): Promise<ProgressInfo | null> {
    const project = await this.deps.projects.getById(id);
    return project ? new ResearchProjectAggregate(project).progress() : null;
  }

  async getMetrics(id: string, now: string): Promise<ResearchMetrics | null> {
    const project = await this.deps.projects.getById(id);
    return project ? new ResearchProjectAggregate(project).metrics(now) : null;
  }

  async getSummary(): Promise<ResearchSummary> {
    const projects = await this.deps.projects.list();
    const stageCount = new Map<ResearchStage, number>();
    let awaitingApproval = 0;
    for (const project of projects) {
      const aggregate = new ResearchProjectAggregate(project);
      const stage = aggregate.currentStage();
      stageCount.set(stage, (stageCount.get(stage) ?? 0) + 1);
      if (project.approvals.some((approval) => approval.status === 'PENDING'))
        awaitingApproval += 1;
    }
    return {
      totalProjects: projects.length,
      active: projects.filter((p) => p.status === 'ACTIVE').length,
      blocked: projects.filter((p) => p.status === 'BLOCKED').length,
      completed: projects.filter((p) => p.status === 'COMPLETED').length,
      awaitingApproval,
      byStage: [...stageCount.entries()].map(([stage, count]) => ({ stage, count })),
    };
  }

  /**
   * Advance a project's lifecycle by one gated step (no skipping). Pure decision;
   * the effect is a governed event + a workflow schedule. No persistence in v1.
   */
  async advanceStage(id: string, at: string): Promise<AdvanceOutcome | null> {
    const project = await this.deps.projects.getById(id);
    if (!project) return null;
    const result = new ResearchProjectAggregate(project).advanced(at);
    if (result.changed && result.advancedTo) {
      await this.deps.bus.publish({
        id: `${id}:STAGE_ADVANCED:${result.advancedTo}`,
        projectId: id,
        type: 'STAGE_ADVANCED',
        message: `Advanced to ${result.advancedTo}.`,
        stage: result.advancedTo,
        occurredAt: at,
      });
      await this.deps.workflow.scheduleStage(id, result.advancedTo);
    }
    return {
      projectId: id,
      advancedTo: result.advancedTo,
      stages: result.stages,
      changed: result.changed,
    };
  }

  /** Record an approval request (the decision is made by governance/humans). */
  async requestApproval(id: string, at: string): Promise<boolean> {
    const project = await this.deps.projects.getById(id);
    if (!project) return false;
    await this.deps.bus.publish({
      id: `${id}:APPROVAL_REQUESTED`,
      projectId: id,
      type: 'APPROVAL_REQUESTED',
      message: 'Approval requested.',
      stage: 'APPROVAL',
      occurredAt: at,
    });
    return true;
  }
}
