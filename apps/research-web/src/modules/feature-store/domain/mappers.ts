/**
 * DTO → view-model mappings + summary aggregation. All presentation and
 * aggregation decisions live here so UI components stay logic-free. Pure and
 * deterministic. The canonical `namespace/family/name` key and version ordering
 * come from `@platform/feature-store-sdk`. Counts are derived — never a statistic.
 */
import {
  compareVersions,
  featureKey,
  type ApprovalStatus,
  type DependencyKind,
  type DependencyStatus,
  type FeatureDependency,
  type FeatureFamily,
  type FeatureLifecycleStatus,
  type FeatureVersion,
  type HealthStatus,
  type LineageNode,
  type LineageNodeKind,
  type QualityGrade,
  type RegisteredFeature,
  type SyncStatus,
  type ValidationStatus,
} from '@platform/feature-store-sdk';
import type {
  DependencyVm,
  FeatureCatalogItemVm,
  FeatureDetailVm,
  FeatureFamilyVm,
  FeatureStoreSummaryVm,
  LineageVm,
  SummaryBucketVm,
  Tone,
  VersionVm,
} from './view-model';

const LIFECYCLE_LABEL: Record<FeatureLifecycleStatus, string> = {
  DRAFT: 'Draft',
  PROPOSED: 'Proposed',
  APPROVED: 'Approved',
  DEPRECATED: 'Deprecated',
  RETIRED: 'Retired',
};
const LIFECYCLE_TONE: Record<FeatureLifecycleStatus, Tone> = {
  DRAFT: 'info',
  PROPOSED: 'warning',
  APPROVED: 'positive',
  DEPRECATED: 'neutral',
  RETIRED: 'neutral',
};

const APPROVAL_LABEL: Record<ApprovalStatus, string> = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  NOT_REQUESTED: 'Not requested',
};
const APPROVAL_TONE: Record<ApprovalStatus, Tone> = {
  PENDING: 'warning',
  APPROVED: 'positive',
  REJECTED: 'danger',
  NOT_REQUESTED: 'neutral',
};

const QUALITY_LABEL: Record<QualityGrade, string> = { PASS: 'Pass', WARN: 'Warn', FAIL: 'Fail' };
const QUALITY_TONE: Record<QualityGrade, Tone> = {
  PASS: 'positive',
  WARN: 'warning',
  FAIL: 'danger',
};

const HEALTH_LABEL: Record<HealthStatus, string> = {
  HEALTHY: 'Healthy',
  DEGRADED: 'Degraded',
  STALE: 'Stale',
  UNKNOWN: 'Unknown',
};
const HEALTH_TONE: Record<HealthStatus, Tone> = {
  HEALTHY: 'positive',
  DEGRADED: 'danger',
  STALE: 'warning',
  UNKNOWN: 'neutral',
};

const VALIDATION_LABEL: Record<ValidationStatus, string> = {
  PASSED: 'Passed',
  FAILED: 'Failed',
  PENDING: 'Pending',
  NOT_RUN: 'Not run',
};
const VALIDATION_TONE: Record<ValidationStatus, Tone> = {
  PASSED: 'positive',
  FAILED: 'danger',
  PENDING: 'warning',
  NOT_RUN: 'neutral',
};

const SYNC_LABEL: Record<SyncStatus, string> = {
  SYNCED: 'Synced',
  PENDING: 'Pending',
  DRIFTED: 'Drifted',
  ERROR: 'Error',
};
const SYNC_TONE: Record<SyncStatus, Tone> = {
  SYNCED: 'positive',
  PENDING: 'warning',
  DRIFTED: 'warning',
  ERROR: 'danger',
};

const DEP_LABEL: Record<DependencyStatus, string> = {
  SATISFIED: 'Satisfied',
  PENDING: 'Pending',
  MISSING: 'Missing',
};
const DEP_TONE: Record<DependencyStatus, Tone> = {
  SATISFIED: 'positive',
  PENDING: 'warning',
  MISSING: 'danger',
};

const DEP_ROUTE: Record<DependencyKind, string> = { DATASET: '/datasets', FEATURE: '/features' };
const LINEAGE_ROUTE: Partial<Record<LineageNodeKind, string>> = {
  DATASET: '/datasets',
  FEATURE: '/features',
};

const LIFECYCLE_ORDER: readonly FeatureLifecycleStatus[] = [
  'DRAFT',
  'PROPOSED',
  'APPROVED',
  'DEPRECATED',
  'RETIRED',
];

function dateLabel(iso?: string): string | undefined {
  return iso ? iso.slice(0, 10) : undefined;
}

function percent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function currentVersionString(feature: RegisteredFeature): string {
  const pick = (list: readonly FeatureVersion[]): FeatureVersion | undefined =>
    list.reduce<FeatureVersion | undefined>(
      (best, candidate) =>
        !best || compareVersions(candidate.version, best.version) > 0 ? candidate : best,
      undefined,
    );
  const approved = feature.versions.filter((v) => v.status === 'APPROVED');
  return pick(approved.length > 0 ? approved : feature.versions)?.version ?? feature.version;
}

function toDependencyVm(dependency: FeatureDependency): DependencyVm {
  return {
    id: dependency.id,
    kind: dependency.kind,
    name: dependency.name,
    href: `${DEP_ROUTE[dependency.kind]}/${dependency.ref}`,
    status: {
      value: dependency.status,
      label: DEP_LABEL[dependency.status],
      tone: DEP_TONE[dependency.status],
    },
  };
}

function toLineageVm(feature: RegisteredFeature): LineageVm {
  const nodeHref = (node: LineageNode): string | undefined => {
    const base = LINEAGE_ROUTE[node.kind];
    return base ? `${base}/${node.ref}` : undefined;
  };
  return {
    nodes: feature.lineage.nodes.map((node) => ({
      id: node.id,
      kind: node.kind,
      label: node.label,
      href: nodeHref(node),
    })),
    edges: feature.lineage.edges.map((edge) => ({ from: edge.from, to: edge.to })),
  };
}

function toVersionVm(version: FeatureVersion, currentValue: string): VersionVm {
  return {
    version: version.version,
    status: {
      value: version.status,
      label: LIFECYCLE_LABEL[version.status],
      tone: LIFECYCLE_TONE[version.status],
    },
    createdLabel: dateLabel(version.createdAt) ?? '—',
    note: version.note,
    manifestHash: version.manifestHash,
    current: version.version === currentValue,
  };
}

export function toCatalogItemVm(feature: RegisteredFeature): FeatureCatalogItemVm {
  return {
    id: feature.id,
    slug: feature.slug,
    name: feature.name,
    description: feature.description,
    namespace: feature.namespace,
    family: feature.family,
    version: feature.version,
    status: {
      value: feature.status,
      label: LIFECYCLE_LABEL[feature.status],
      tone: LIFECYCLE_TONE[feature.status],
    },
    validation: {
      value: feature.validation,
      label: VALIDATION_LABEL[feature.validation],
      tone: VALIDATION_TONE[feature.validation],
    },
    quality: {
      value: feature.quality.grade,
      label: QUALITY_LABEL[feature.quality.grade],
      tone: QUALITY_TONE[feature.quality.grade],
    },
    health: {
      value: feature.health.status,
      label: HEALTH_LABEL[feature.health.status],
      tone: HEALTH_TONE[feature.health.status],
    },
    sync: {
      value: feature.sync.status,
      label: SYNC_LABEL[feature.sync.status],
      tone: SYNC_TONE[feature.sync.status],
    },
    owner: feature.owner.owner,
    tags: feature.tags,
    usageLabel: `${feature.usage.consumers} consumers`,
    updatedLabel: dateLabel(feature.updatedAt) ?? '—',
  };
}

export function toDetailVm(feature: RegisteredFeature): FeatureDetailVm {
  const currentValue = currentVersionString(feature);
  return {
    id: feature.id,
    slug: feature.slug,
    name: feature.name,
    description: feature.description,
    namespace: feature.namespace,
    family: feature.family,
    key: featureKey(feature.namespace, feature.family, feature.name),
    version: feature.version,
    status: {
      value: feature.status,
      label: LIFECYCLE_LABEL[feature.status],
      tone: LIFECYCLE_TONE[feature.status],
    },
    approval: {
      value: feature.approval,
      label: APPROVAL_LABEL[feature.approval],
      tone: APPROVAL_TONE[feature.approval],
    },
    validation: {
      value: feature.validation,
      label: VALIDATION_LABEL[feature.validation],
      tone: VALIDATION_TONE[feature.validation],
    },
    quality: {
      grade: {
        value: feature.quality.grade,
        label: QUALITY_LABEL[feature.quality.grade],
        tone: QUALITY_TONE[feature.quality.grade],
      },
      completeness: percent(feature.quality.completeness),
      stability: percent(feature.quality.stability),
      checkedLabel: dateLabel(feature.quality.checkedAt),
    },
    health: {
      status: {
        value: feature.health.status,
        label: HEALTH_LABEL[feature.health.status],
        tone: HEALTH_TONE[feature.health.status],
      },
      message: feature.health.message,
      refreshedLabel: dateLabel(feature.health.lastRefreshedAt),
    },
    sync: {
      status: {
        value: feature.sync.status,
        label: SYNC_LABEL[feature.sync.status],
        tone: SYNC_TONE[feature.sync.status],
      },
      registryRef: feature.sync.registryRef,
      syncedLabel: dateLabel(feature.sync.lastSyncedAt),
    },
    owner: { owner: feature.owner.owner, team: feature.owner.team, steward: feature.owner.steward },
    usage: {
      consumers: feature.usage.consumers,
      signals: feature.usage.signals,
      backtests: feature.usage.backtests,
      lastAccessedLabel: dateLabel(feature.usage.lastAccessedAt),
    },
    definition: {
      entity: feature.definition.entity,
      valueType: feature.definition.valueType,
      timeframe: feature.definition.timeframe,
      rationale: feature.definition.rationale,
    },
    schema: feature.definition.schema.fields.map((field) => ({
      name: field.name,
      type: field.type,
      nullable: field.nullable,
      description: field.description,
    })),
    versions: [...feature.versions]
      .sort((a, b) => compareVersions(b.version, a.version))
      .map((version) => toVersionVm(version, currentValue)),
    dependencies: feature.dependencies.map(toDependencyVm),
    lineage: toLineageVm(feature),
    tags: feature.tags,
    metadata: [
      { label: 'Namespace', value: feature.namespace },
      { label: 'Family', value: feature.family },
      { label: 'Entity', value: feature.definition.entity },
      { label: 'Value type', value: feature.definition.valueType },
      { label: 'Timeframe', value: feature.definition.timeframe },
      { label: 'Registry ref', value: feature.registryRef },
      { label: 'Registered', value: dateLabel(feature.registeredAt) ?? '—' },
      { label: 'Updated', value: dateLabel(feature.updatedAt) ?? '—' },
      ...feature.metadata.map((entry) => ({ label: entry.key, value: entry.value })),
    ],
  };
}

export function toFamilyVm(family: FeatureFamily): FeatureFamilyVm {
  return {
    id: `${family.namespace}/${family.family}`,
    namespace: family.namespace,
    family: family.family,
    description: family.description,
    featureCount: family.featureCount,
  };
}

export function toSummaryVm(
  features: readonly RegisteredFeature[],
  families: readonly FeatureFamily[],
): FeatureStoreSummaryVm {
  const statusCount = new Map<FeatureLifecycleStatus, number>();
  for (const feature of features)
    statusCount.set(feature.status, (statusCount.get(feature.status) ?? 0) + 1);
  const byStatus: SummaryBucketVm[] = LIFECYCLE_ORDER.map((status) => ({
    value: status,
    label: LIFECYCLE_LABEL[status],
    count: statusCount.get(status) ?? 0,
    tone: LIFECYCLE_TONE[status],
  })).filter((bucket) => bucket.count > 0);

  return {
    totalFeatures: features.length,
    approved: features.filter((f) => f.status === 'APPROVED').length,
    proposed: features.filter((f) => f.status === 'PROPOSED').length,
    awaitingValidation: features.filter(
      (f) => f.validation === 'PENDING' || f.validation === 'NOT_RUN',
    ).length,
    qualityWarnings: features.filter((f) => f.quality.grade !== 'PASS').length,
    syncDrift: features.filter((f) => f.sync.status === 'DRIFTED' || f.sync.status === 'ERROR')
      .length,
    families: families.length,
    byStatus,
  };
}
