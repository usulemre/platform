import Link from 'next/link';
import { InfoCard, KeyValueList, StatusBadge, TagList } from './feature-store-atoms';
import type {
  DependencyVm,
  FeatureDetailVm,
  HealthVm,
  LineageVm,
  MetadataRowVm,
  OwnerVm,
  QualityVm,
  SchemaFieldVm,
  StatusVm,
  SyncVm,
  UsageVm,
  VersionVm,
} from '../domain/view-model';

/** Feature Definition — declarative "what it is", never how it is computed. */
export function DefinitionPanel({
  definition,
  rationale,
}: {
  definition: FeatureDetailVm['definition'];
  rationale: string;
}) {
  const rows: MetadataRowVm[] = [
    { label: 'Entity', value: definition.entity },
    { label: 'Value type', value: definition.valueType },
    { label: 'Timeframe', value: definition.timeframe },
  ];
  return (
    <InfoCard title="Definition">
      <div className="space-y-3 text-sm">
        <p className="text-muted-foreground">{rationale}</p>
        <KeyValueList rows={rows} />
      </div>
    </InfoCard>
  );
}

/** Feature Schema — the declared output fields. */
export function SchemaPanel({ fields }: { fields: readonly SchemaFieldVm[] }) {
  return (
    <InfoCard title="Schema">
      {fields.length === 0 ? (
        <p className="text-sm text-muted-foreground">No schema fields.</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {fields.map((field) => (
            <li key={field.name} className="flex items-start justify-between gap-4 border-b py-1">
              <span>
                <span className="font-mono font-medium">{field.name}</span>
                <span className="ml-2 text-xs uppercase text-muted-foreground">{field.type}</span>
                {field.description ? (
                  <p className="text-xs text-muted-foreground">{field.description}</p>
                ) : null}
              </span>
              <span className="text-xs text-muted-foreground">
                {field.nullable ? 'nullable' : 'required'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </InfoCard>
  );
}

/** Feature Versions — immutable, versioned definitions (newest first). */
export function VersionsPanel({ versions }: { versions: readonly VersionVm[] }) {
  return (
    <InfoCard title="Versions">
      {versions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No versions.</p>
      ) : (
        <ol className="space-y-2 text-sm">
          {versions.map((version) => (
            <li key={version.version} className="border-b py-1">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <span className="font-mono font-medium">{version.version}</span>
                  {version.current ? (
                    <span className="text-xs uppercase text-primary">current</span>
                  ) : null}
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{version.createdLabel}</span>
                  <StatusBadge label={version.status.label} tone={version.status.tone} />
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{version.note}</p>
              <p className="font-mono text-[11px] text-muted-foreground">{version.manifestHash}</p>
            </li>
          ))}
        </ol>
      )}
    </InfoCard>
  );
}

/** Feature Dependencies — upstream datasets/features (cross-linked). */
export function DependenciesPanel({ dependencies }: { dependencies: readonly DependencyVm[] }) {
  return (
    <InfoCard title="Dependencies">
      {dependencies.length === 0 ? (
        <p className="text-sm text-muted-foreground">No dependencies.</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {dependencies.map((dependency) => (
            <li
              key={dependency.id}
              className="flex items-center justify-between gap-4 border-b py-1"
            >
              <span className="flex items-center gap-2">
                <StatusBadge label={dependency.kind} tone="info" />
                <Link href={dependency.href} className="font-medium hover:underline">
                  {dependency.name}
                </Link>
              </span>
              <StatusBadge label={dependency.status.label} tone={dependency.status.tone} />
            </li>
          ))}
        </ul>
      )}
    </InfoCard>
  );
}

/** Feature Lineage — provenance from raw sources to the feature. */
export function LineagePanel({ lineage }: { lineage: LineageVm }) {
  return (
    <InfoCard title="Lineage">
      {lineage.nodes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No lineage recorded.</p>
      ) : (
        <ol className="space-y-2 text-sm">
          {lineage.nodes.map((node, index) => (
            <li key={node.id} className="flex items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">{index + 1}</span>
              <StatusBadge label={node.kind.replace('_', ' ')} tone="neutral" />
              {node.href ? (
                <Link href={node.href} className="font-medium hover:underline">
                  {node.label}
                </Link>
              ) : (
                <span className="font-medium">{node.label}</span>
              )}
            </li>
          ))}
        </ol>
      )}
    </InfoCard>
  );
}

/** Feature Ownership — owner, team and steward. */
export function OwnershipPanel({ owner }: { owner: OwnerVm }) {
  const rows: MetadataRowVm[] = [
    { label: 'Owner', value: owner.owner },
    { label: 'Team', value: owner.team },
    { label: 'Steward', value: owner.steward },
  ];
  return (
    <InfoCard title="Ownership">
      <KeyValueList rows={rows} />
    </InfoCard>
  );
}

/** Feature Usage — downstream consumers, signals, backtests. */
export function UsagePanel({ usage }: { usage: UsageVm }) {
  const rows: MetadataRowVm[] = [
    { label: 'Consumers', value: usage.consumers },
    { label: 'Signals', value: usage.signals },
    { label: 'Backtests', value: usage.backtests },
    { label: 'Last accessed', value: usage.lastAccessedLabel ?? '—' },
  ];
  return (
    <InfoCard title="Usage">
      <KeyValueList rows={rows} />
    </InfoCard>
  );
}

/** Feature Quality — completeness/stability indicators (verdict decided elsewhere). */
export function QualityPanel({ quality }: { quality: QualityVm }) {
  const rows: MetadataRowVm[] = [
    { label: 'Completeness', value: quality.completeness },
    { label: 'Stability', value: quality.stability },
    { label: 'Checked', value: quality.checkedLabel ?? '—' },
  ];
  return (
    <InfoCard
      title="Quality"
      action={<StatusBadge label={quality.grade.label} tone={quality.grade.tone} />}
    >
      <KeyValueList rows={rows} />
    </InfoCard>
  );
}

/** Feature Health — operational health indicator. */
export function HealthPanel({ health, validation }: { health: HealthVm; validation: StatusVm }) {
  return (
    <InfoCard
      title="Health"
      action={<StatusBadge label={health.status.label} tone={health.status.tone} />}
    >
      <div className="space-y-2 text-sm">
        <p className="text-muted-foreground">{health.message}</p>
        <div className="flex items-center justify-between gap-4 border-b py-1">
          <span className="text-muted-foreground">Validation status</span>
          <StatusBadge label={validation.label} tone={validation.tone} />
        </div>
        <div className="flex items-center justify-between gap-4 py-1">
          <span className="text-muted-foreground">Last refreshed</span>
          <span className="font-medium">{health.refreshedLabel ?? '—'}</span>
        </div>
      </div>
    </InfoCard>
  );
}

/** Feature Registry Synchronization — sync state with the Feature Registry. */
export function RegistrySyncPanel({ sync }: { sync: SyncVm }) {
  return (
    <InfoCard
      title="Registry synchronization"
      action={<StatusBadge label={sync.status.label} tone={sync.status.tone} />}
    >
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between gap-4 border-b py-1">
          <span className="text-muted-foreground">Registry ref</span>
          <span className="font-mono font-medium">{sync.registryRef}</span>
        </div>
        <div className="flex items-center justify-between gap-4 py-1">
          <span className="text-muted-foreground">Last synced</span>
          <span className="font-medium">{sync.syncedLabel ?? '—'}</span>
        </div>
        <p role="note" className="text-xs text-muted-foreground">
          The Feature Registry is the source of truth; the store only reflects and requests sync.
        </p>
      </div>
    </InfoCard>
  );
}

/** Feature Tags. */
export function TagsPanel({ tags }: { tags: readonly string[] }) {
  return (
    <InfoCard title="Tags">
      <TagList tags={tags} />
    </InfoCard>
  );
}

/** Feature Metadata. */
export function MetadataPanel({ rows }: { rows: readonly MetadataRowVm[] }) {
  return (
    <InfoCard title="Metadata">
      <KeyValueList rows={rows} />
    </InfoCard>
  );
}
