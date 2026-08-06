/**
 * In-memory foundation + integration adapters. ABSTRACTIONS with no real IO: no
 * persistence, no broker (no Kafka/Rabbit), no provider. Other modules are
 * reached by reference only.
 */
import type { ArtifactKind, ResearchStage } from '@platform/research-sdk';
import type {
  ConfigurationPort,
  EventBusPort,
  ModuleArtifactHandle,
  ModuleArtifactPort,
  ResearchEvent,
  ValidationPort,
  WorkflowPort,
  WorkspaceHandle,
  WorkspacePort,
} from '../ports';
import { MODULE_ARTIFACTS } from './seed';

/** Lists artifact references from the other modules (dataset/feature/…). */
export class StubModuleArtifacts implements ModuleArtifactPort {
  constructor(private readonly handles: readonly ModuleArtifactHandle[] = MODULE_ARTIFACTS) {}
  async listArtifacts(kind: ArtifactKind): Promise<readonly ModuleArtifactHandle[]> {
    return this.handles.filter((handle) => handle.kind === kind);
  }
}

/** Research Workspace integration handle (a link + pin count). */
export class StubWorkspace implements WorkspacePort {
  constructor(
    private readonly handle: WorkspaceHandle = { href: '/workspace', pinnedProjects: 3 },
  ) {}
  async getWorkspace(): Promise<WorkspaceHandle> {
    return this.handle;
  }
}

/** Validation Foundation stub — gate clearance is decided elsewhere; here a set. */
export class StubValidation implements ValidationPort {
  constructor(
    private readonly cleared: ReadonlySet<string> = new Set([
      'RP-RATES:RISK_REVIEW',
      'RP-MOMENTUM:FEATURE_VALIDATION',
    ]),
  ) {}
  async isGateCleared(projectId: string, stage: ResearchStage): Promise<boolean> {
    return this.cleared.has(`${projectId}:${stage}`);
  }
}

/** Workflow Engine port stub — records stage scheduling requests. */
export class StubWorkflow implements WorkflowPort {
  readonly scheduled: { projectId: string; stage: ResearchStage }[] = [];
  async scheduleStage(projectId: string, stage: ResearchStage): Promise<void> {
    this.scheduled.push({ projectId, stage });
  }
}

/** In-memory event bus (an array) — NOT a broker. Captures published events. */
export class InMemoryEventBus implements EventBusPort {
  readonly published: ResearchEvent[] = [];
  async publish(event: ResearchEvent): Promise<void> {
    this.published.push(event);
  }
}

/** Configuration Foundation stub — static, non-secret key/values. */
export class StaticConfiguration implements ConfigurationPort {
  constructor(private readonly values: Readonly<Record<string, string>> = {}) {}
  get(key: string): string | undefined {
    return this.values[key];
  }
}
