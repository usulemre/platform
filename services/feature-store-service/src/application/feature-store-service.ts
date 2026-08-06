/**
 * Feature Store application service — the orchestration surface of the canonical
 * Feature Store. It coordinates feature discovery/search, catalog reads, family
 * browsing, registry synchronization and registration/versioning requests across
 * the other subsystems (Feature Discovery Engine, Feature Registry, Validation
 * Foundation, Workflow Engine, Configuration Foundation) through ports ONLY.
 *
 * It holds no infrastructure, no feature calculations, no statistics and no
 * persistence. Search, aggregation and version selection are pure domain
 * decisions. Approval/validation verdicts are decided elsewhere (CP-5); this
 * service only reflects and reroutes them.
 */
import type { FeatureFamily, FeatureVersion, RegisteredFeature } from '@platform/feature-store-sdk';
import { currentVersion } from '../domain/derivations';
import { resolveByKey, searchFeatures, type FeatureSearch } from '../domain/discovery';
import type {
  ConfigurationPort,
  DiscoveryCandidate,
  EventBusPort,
  FamilyQueryPort,
  FeatureDiscoveryPort,
  FeatureQueryPort,
  FeatureRegistryPort,
  ValidationPort,
  WorkflowPort,
} from '../infrastructure/ports';

export interface FeatureStoreSummary {
  readonly totalFeatures: number;
  readonly approved: number;
  readonly proposed: number;
  readonly deprecated: number;
  readonly awaitingValidation: number;
  readonly qualityWarnings: number;
  readonly syncDrift: number;
  readonly families: number;
}

export interface FeatureStoreServiceDeps {
  readonly features: FeatureQueryPort;
  readonly families: FamilyQueryPort;
  readonly discovery: FeatureDiscoveryPort;
  readonly registry: FeatureRegistryPort;
  readonly validation: ValidationPort;
  readonly workflow: WorkflowPort;
  readonly bus: EventBusPort;
  readonly config: ConfigurationPort;
}

export class FeatureStoreService {
  constructor(private readonly deps: FeatureStoreServiceDeps) {}

  /** Feature Catalog — every registered feature. */
  listFeatures(): Promise<readonly RegisteredFeature[]> {
    return this.deps.features.list();
  }

  /** Feature Explorer / Search — pure filter over the catalog. */
  async searchFeatures(query: FeatureSearch = {}): Promise<readonly RegisteredFeature[]> {
    return searchFeatures(await this.deps.features.list(), query);
  }

  /** Feature Details — resolve one feature by id. */
  getFeature(id: string): Promise<RegisteredFeature | null> {
    return this.deps.features.getById(id);
  }

  /** Resolve a feature by its canonical `namespace/family/name` key. */
  async resolveFeature(key: string): Promise<RegisteredFeature | null> {
    return resolveByKey(await this.deps.features.list(), key);
  }

  /** The current recommended version of a feature (newest APPROVED, else newest). */
  async currentVersion(id: string): Promise<FeatureVersion | null> {
    const feature = await this.deps.features.getById(id);
    return feature ? currentVersion(feature) : null;
  }

  /** Feature Family browsing. */
  listFamilies(): Promise<readonly FeatureFamily[]> {
    return this.deps.families.list();
  }

  /** Candidate features proposed by the Feature Discovery Engine (ref only). */
  listDiscoveryCandidates(): Promise<readonly DiscoveryCandidate[]> {
    return this.deps.discovery.listCandidates();
  }

  /** Whether a feature cleared its validation gate (decided by Validation). */
  isValidated(id: string): Promise<boolean> {
    return this.deps.validation.isValidated(id);
  }

  async getSummary(): Promise<FeatureStoreSummary> {
    const [features, families] = await Promise.all([
      this.deps.features.list(),
      this.deps.families.list(),
    ]);
    return {
      totalFeatures: features.length,
      approved: features.filter((f) => f.status === 'APPROVED').length,
      proposed: features.filter((f) => f.status === 'PROPOSED').length,
      deprecated: features.filter((f) => f.status === 'DEPRECATED' || f.status === 'RETIRED')
        .length,
      awaitingValidation: features.filter(
        (f) => f.validation === 'PENDING' || f.validation === 'NOT_RUN',
      ).length,
      qualityWarnings: features.filter((f) => f.quality.grade !== 'PASS').length,
      syncDrift: features.filter((f) => f.sync.status === 'DRIFTED' || f.sync.status === 'ERROR')
        .length,
      families: families.length,
    };
  }

  /**
   * Feature Registry Synchronization — request the registry to re-sync a feature.
   * The store orchestrates; the registry is the source of truth. Emits a governed
   * event. No persistence in v1.
   */
  async requestSync(featureId: string, at: string): Promise<boolean> {
    const feature = await this.deps.features.getById(featureId);
    if (!feature) return false;
    await this.deps.registry.requestSync(featureId);
    await this.deps.bus.publish({
      id: `${featureId}:SYNC_REQUESTED:${at}`,
      featureId,
      type: 'SYNC_REQUESTED',
      message: `Registry sync requested for ${feature.name}.`,
      occurredAt: at,
    });
    return true;
  }

  /**
   * Feature Registration — schedule the registration workflow for an approved,
   * validated candidate. The decision to register lives with governance/workflow;
   * this only orchestrates and records the request.
   */
  async requestRegistration(featureId: string, at: string): Promise<boolean> {
    const feature = await this.deps.features.getById(featureId);
    if (!feature) return false;
    await this.deps.workflow.scheduleRegistration(featureId);
    await this.deps.bus.publish({
      id: `${featureId}:REGISTERED:${at}`,
      featureId,
      type: 'REGISTERED',
      message: `Registration workflow scheduled for ${feature.name}.`,
      occurredAt: at,
    });
    return true;
  }
}
