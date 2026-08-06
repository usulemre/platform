import { Badge } from '@platform/ui';
import { InfoCard, KeyValueList, StatusBadge } from './ingestion-atoms';
import type {
  EventVm,
  MetadataRowVm,
  MetricsVm,
  PipelineDetailVm,
  QualityVm,
  StageStepVm,
} from '../domain/view-model';

/** Pipeline stage monitor — the live progression across the canonical stages. */
export function StageMonitor({ stages }: { stages: readonly StageStepVm[] }) {
  return (
    <InfoCard title="Pipeline monitoring (stages)">
      <ol className="space-y-2">
        {stages.map((step) => (
          <li
            key={step.stage}
            className="flex items-center justify-between gap-3 border-b py-1 text-sm last:border-0"
          >
            <span className="font-medium">{step.label}</span>
            <span className="flex items-center gap-2">
              {step.note ? (
                <span className="text-xs text-muted-foreground">{step.note}</span>
              ) : null}
              <StatusBadge label={step.state.label} tone={step.state.tone} />
            </span>
          </li>
        ))}
      </ol>
    </InfoCard>
  );
}

/** Pipeline metrics (pre-supplied operational values; nothing computed). */
export function PipelineMetrics({ metrics }: { metrics: MetricsVm }) {
  const rows: MetadataRowVm[] = [
    { label: 'Records ingested', value: metrics.recordsIngested },
    { label: 'Throughput', value: metrics.throughput },
    { label: 'Avg latency', value: metrics.avgLatency },
    { label: 'Error rate', value: metrics.errorRate },
    { label: 'Last run', value: metrics.lastRunLabel ?? '—' },
  ];
  return (
    <InfoCard title="Metrics">
      <KeyValueList rows={rows} />
    </InfoCard>
  );
}

/** Pipeline validation — schema + quality gates (Validation Foundation). */
export function PipelineValidation({
  stages,
  quality,
}: {
  stages: readonly StageStepVm[];
  quality: QualityVm;
}) {
  const schema = stages.find((step) => step.stage === 'SCHEMA_VALIDATION');
  const qualityStage = stages.find((step) => step.stage === 'QUALITY_VALIDATION');
  return (
    <InfoCard title="Validation">
      <div className="space-y-2 text-sm">
        <p className="flex items-center gap-2">
          <span className="text-muted-foreground">Schema validation:</span>
          {schema ? (
            <StatusBadge label={schema.state.label} tone={schema.state.tone} />
          ) : (
            <span>—</span>
          )}
        </p>
        <p className="flex items-center gap-2">
          <span className="text-muted-foreground">Quality gate:</span>
          {qualityStage ? (
            <StatusBadge label={qualityStage.state.label} tone={qualityStage.state.tone} />
          ) : (
            <span>—</span>
          )}
          <StatusBadge label={quality.grade.label} tone={quality.grade.tone} />
        </p>
        <p className="text-xs text-muted-foreground">
          {quality.completeness} complete · {quality.validity} valid
          {quality.checkedLabel ? ` · checked ${quality.checkedLabel}` : ''}
        </p>
      </div>
    </InfoCard>
  );
}

/** Pipeline capabilities (declared building blocks). */
export function PipelineCapabilities({ capabilities }: { capabilities: readonly string[] }) {
  return (
    <InfoCard title="Capabilities">
      {capabilities.length === 0 ? (
        <p className="text-sm text-muted-foreground">No capabilities declared.</p>
      ) : (
        <div className="flex flex-wrap gap-1">
          {capabilities.map((capability) => (
            <Badge key={capability} variant="secondary">
              {capability}
            </Badge>
          ))}
        </div>
      )}
    </InfoCard>
  );
}

/** Pipeline metadata panel. */
export function PipelineMetadata({ metadata }: { metadata: PipelineDetailVm['metadata'] }) {
  return (
    <InfoCard title="Metadata">
      <KeyValueList rows={metadata} />
    </InfoCard>
  );
}

/** Pipeline history — the recent lifecycle events (Pipeline Events). */
export function PipelineHistory({ events }: { events: readonly EventVm[] }) {
  return (
    <InfoCard title="History">
      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">No recent events.</p>
      ) : (
        <ol className="space-y-3">
          {events.map((event) => (
            <li key={event.id} className="flex items-start gap-3 text-sm">
              <StatusBadge label={event.type.label} tone={event.type.tone} />
              <div className="flex flex-1 items-center justify-between gap-2">
                <span>
                  {event.message}
                  {event.stageLabel ? (
                    <span className="ml-1 text-xs text-muted-foreground">· {event.stageLabel}</span>
                  ) : null}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {event.occurredLabel}
                </span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </InfoCard>
  );
}
