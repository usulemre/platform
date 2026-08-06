/**
 * Signal Engine application service — the orchestration surface of the canonical
 * Signal Engine. It coordinates the signal research lifecycle (candidate →
 * research → validation → review → approval → registry → production candidate),
 * discovery/search, catalog reads, the promotion and approval queues, and
 * registry synchronization across the other subsystems (Research Engine, Feature
 * Store, Feature Discovery Engine, Signal Registry, Validation Foundation,
 * Workflow Engine, Configuration Foundation, Event & Messaging Foundation)
 * through ports ONLY.
 *
 * It holds no infrastructure, no alpha models, no signal calculations, no
 * statistics, no ML and no persistence. Search, aggregation, queue selection and
 * version selection are pure domain decisions. Validation verdicts and approvals
 * are decided elsewhere (CP-5); this service only reflects and reroutes them.
 */
import type {
  RegisteredSignal,
  SignalFamily,
  SignalStage,
  SignalVersion,
} from '@platform/signal-sdk';
import { currentVersion, approvalQueue, promotionQueue } from '../domain/derivations';
import { resolveByKey, searchSignals, type SignalSearch } from '../domain/discovery';
import { proposedNextStage } from '../domain/lifecycle';
import type {
  ConfigurationPort,
  EventBusPort,
  FamilyQueryPort,
  FeatureStorePort,
  SignalCandidate,
  SignalDiscoveryPort,
  SignalQueryPort,
  SignalRegistryPort,
  ValidationPort,
  WorkflowPort,
} from '../infrastructure/ports';

export interface SignalEngineSummary {
  readonly totalSignals: number;
  readonly production: number;
  readonly awaitingValidation: number;
  readonly awaitingApproval: number;
  readonly queuedForPromotion: number;
  readonly qualityWarnings: number;
  readonly syncDrift: number;
  readonly families: number;
  readonly byStage: readonly { readonly stage: SignalStage; readonly count: number }[];
}

export interface SignalEngineServiceDeps {
  readonly signals: SignalQueryPort;
  readonly families: FamilyQueryPort;
  readonly discovery: SignalDiscoveryPort;
  readonly featureStore: FeatureStorePort;
  readonly registry: SignalRegistryPort;
  readonly validation: ValidationPort;
  readonly workflow: WorkflowPort;
  readonly bus: EventBusPort;
  readonly config: ConfigurationPort;
}

export class SignalEngineService {
  constructor(private readonly deps: SignalEngineServiceDeps) {}

  /** Signal Catalog — every registered signal. */
  listSignals(): Promise<readonly RegisteredSignal[]> {
    return this.deps.signals.list();
  }

  /** Signal Registry Explorer / Search — pure filter over the catalog. */
  async searchSignals(query: SignalSearch = {}): Promise<readonly RegisteredSignal[]> {
    return searchSignals(await this.deps.signals.list(), query);
  }

  /** Signal Details — resolve one signal by id. */
  getSignal(id: string): Promise<RegisteredSignal | null> {
    return this.deps.signals.getById(id);
  }

  /** Resolve a signal by its canonical `namespace/family/name` key. */
  async resolveSignal(key: string): Promise<RegisteredSignal | null> {
    return resolveByKey(await this.deps.signals.list(), key);
  }

  /** The current recommended version of a signal (newest by semantic order). */
  async currentVersion(id: string): Promise<SignalVersion | null> {
    const signal = await this.deps.signals.getById(id);
    return signal ? currentVersion(signal) : null;
  }

  /** The stage a signal would advance to next (pure ordering; no decision). */
  async proposedNextStage(id: string): Promise<SignalStage | null> {
    const signal = await this.deps.signals.getById(id);
    return signal ? proposedNextStage(signal) : null;
  }

  /** Signal Family browsing. */
  listFamilies(): Promise<readonly SignalFamily[]> {
    return this.deps.families.list();
  }

  /** Candidate signals proposed by research / the Feature Discovery Engine. */
  listCandidates(): Promise<readonly SignalCandidate[]> {
    return this.deps.discovery.listCandidates();
  }

  /** Signal Promotion Queue — signals queued/eligible for promotion. */
  async promotionQueue(): Promise<readonly RegisteredSignal[]> {
    return promotionQueue(await this.deps.signals.list());
  }

  /** Signal Approval Queue — signals awaiting a governance approval decision. */
  async approvalQueue(): Promise<readonly RegisteredSignal[]> {
    return approvalQueue(await this.deps.signals.list());
  }

  /** Whether a signal cleared its validation gate (decided by Validation). */
  isValidated(id: string): Promise<boolean> {
    return this.deps.validation.isValidated(id);
  }

  async getSummary(): Promise<SignalEngineSummary> {
    const [signals, families] = await Promise.all([
      this.deps.signals.list(),
      this.deps.families.list(),
    ]);
    const stageCount = new Map<SignalStage, number>();
    for (const signal of signals)
      stageCount.set(signal.stage, (stageCount.get(signal.stage) ?? 0) + 1);
    return {
      totalSignals: signals.length,
      production: signals.filter((s) => s.stage === 'PRODUCTION_CANDIDATE').length,
      awaitingValidation: signals.filter(
        (s) => s.validation.status === 'PENDING' || s.validation.status === 'NOT_RUN',
      ).length,
      awaitingApproval: approvalQueue(signals).length,
      queuedForPromotion: promotionQueue(signals).length,
      qualityWarnings: signals.filter((s) => s.quality.grade !== 'PASS').length,
      syncDrift: signals.filter((s) => s.sync.status === 'DRIFTED' || s.sync.status === 'ERROR')
        .length,
      families: families.length,
      byStage: [...stageCount.entries()].map(([stage, count]) => ({ stage, count })),
    };
  }

  /**
   * Signal Review — request an independent methodology review. The verdict is
   * decided by the reviewer; this only orchestrates and records the request.
   */
  async requestReview(signalId: string, at: string): Promise<boolean> {
    const signal = await this.deps.signals.getById(signalId);
    if (!signal) return false;
    await this.deps.workflow.scheduleReview(signalId);
    await this.deps.bus.publish({
      id: `${signalId}:REVIEW_REQUESTED:${at}`,
      signalId,
      type: 'REVIEW_REQUESTED',
      message: `Review requested for ${signal.name}.`,
      occurredAt: at,
    });
    return true;
  }

  /**
   * Signal Approval — request governance sign-off. The decision is made by
   * accountable humans; this only orchestrates and records the request.
   */
  async requestApproval(signalId: string, at: string): Promise<boolean> {
    const signal = await this.deps.signals.getById(signalId);
    if (!signal) return false;
    await this.deps.workflow.scheduleApproval(signalId);
    await this.deps.bus.publish({
      id: `${signalId}:APPROVAL_REQUESTED:${at}`,
      signalId,
      type: 'APPROVAL_REQUESTED',
      message: `Approval requested for ${signal.name}.`,
      occurredAt: at,
    });
    return true;
  }

  /**
   * Signal Promotion — queue an approved, registered signal for promotion to a
   * production candidate. The promotion decision remains governed.
   */
  async requestPromotion(signalId: string, at: string): Promise<boolean> {
    const signal = await this.deps.signals.getById(signalId);
    if (!signal) return false;
    await this.deps.workflow.schedulePromotion(signalId);
    await this.deps.bus.publish({
      id: `${signalId}:PROMOTION_QUEUED:${at}`,
      signalId,
      type: 'PROMOTION_QUEUED',
      message: `Promotion queued for ${signal.name}.`,
      occurredAt: at,
    });
    return true;
  }

  /**
   * Signal Registry Synchronization — request the registry to re-sync a signal.
   * The registry is the source of truth; the engine only reflects and requests.
   */
  async requestSync(signalId: string, at: string): Promise<boolean> {
    const signal = await this.deps.signals.getById(signalId);
    if (!signal) return false;
    await this.deps.registry.requestSync(signalId);
    await this.deps.bus.publish({
      id: `${signalId}:SYNC_REQUESTED:${at}`,
      signalId,
      type: 'SYNC_REQUESTED',
      message: `Registry sync requested for ${signal.name}.`,
      occurredAt: at,
    });
    return true;
  }
}
