'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@platform/ui';
import {
  useDataQualityOverview,
  useDataSourceOverview,
  useIngestionSummary,
} from '../hooks/use-ingestion';
import {
  IngestionEmpty,
  IngestionError,
  InfoCard,
  PlatformNotice,
  StatusBadge,
} from './ingestion-atoms';

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium uppercase text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

function SummarySection() {
  const { data, isLoading } = useIngestionSummary();
  if (isLoading || !data) {
    return (
      <div
        className="grid grid-cols-2 gap-4 sm:grid-cols-4"
        aria-busy="true"
        aria-label="Loading summary"
      >
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-24 w-full" />
        ))}
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Pipelines" value={data.totalPipelines} />
        <StatCard label="Active" value={data.active} />
        <StatCard label="Failed jobs" value={data.failedJobs} />
        <StatCard label="Dead-letter" value={data.deadLetter} />
      </div>
      {data.byStatus.length > 0 ? (
        <div className="space-y-1">
          <h2 className="text-xs font-semibold uppercase text-muted-foreground">
            Pipelines by status
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            {data.byStatus.map((bucket) => (
              <span key={bucket.value} className="inline-flex items-center gap-1">
                <StatusBadge label={bucket.label} tone={bucket.tone} />
                <span className="text-sm text-muted-foreground">{bucket.count}</span>
              </span>
            ))}
          </div>
        </div>
      ) : null}
      {data.byDataType.length > 0 ? (
        <div className="space-y-1">
          <h2 className="text-xs font-semibold uppercase text-muted-foreground">
            Pipelines by data type
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            {data.byDataType.map((bucket) => (
              <span key={bucket.value} className="inline-flex items-center gap-1">
                <StatusBadge label={bucket.label} tone={bucket.tone} />
                <span className="text-sm text-muted-foreground">{bucket.count}</span>
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Data Source Overview — registered sources and how many pipelines each feeds. */
function DataSourceOverview() {
  const { data, isLoading, isError, refetch } = useDataSourceOverview();
  return (
    <InfoCard title="Data source overview">
      {isLoading ? (
        <IngestionEmpty label="Loading sources…" />
      ) : isError ? (
        <IngestionError onRetry={() => refetch()} />
      ) : !data || data.length === 0 ? (
        <IngestionEmpty label="No sources registered." />
      ) : (
        <ul className="space-y-1 text-sm">
          {data.map((source) => (
            <li key={source.id} className="flex items-center justify-between gap-4 border-b py-1">
              <span>
                <span className="font-medium">{source.name}</span>{' '}
                <span className="font-mono text-xs text-muted-foreground">
                  {source.connectorRef}
                </span>
              </span>
              <span className="text-xs text-muted-foreground">
                {source.connectorType} · {source.pipelineCount} pipeline
                {source.pipelineCount === 1 ? '' : 's'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </InfoCard>
  );
}

/** Data Quality Overview — per-pipeline quality grade and coverage. */
function DataQualityOverview() {
  const { data, isLoading, isError, refetch } = useDataQualityOverview();
  return (
    <InfoCard title="Data quality overview">
      {isLoading ? (
        <IngestionEmpty label="Loading quality…" />
      ) : isError ? (
        <IngestionError onRetry={() => refetch()} />
      ) : !data || data.length === 0 ? (
        <IngestionEmpty label="No quality data." />
      ) : (
        <ul className="space-y-1 text-sm">
          {data.map((row) => (
            <li
              key={row.pipelineId}
              className="flex items-center justify-between gap-4 border-b py-1"
            >
              <Link
                href={`/data-ingestion/${row.pipelineId}`}
                className="font-medium hover:underline"
              >
                {row.pipelineName}
              </Link>
              <span className="flex items-center gap-2">
                <StatusBadge label={row.grade.label} tone={row.grade.tone} />
                <span className="text-xs text-muted-foreground">
                  {row.completeness} complete · {row.validity} valid
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </InfoCard>
  );
}

/** Ingestion dashboard — headline counts, distributions, source and quality
 *  overviews. Aggregation is computed by the application service (pure). */
export function IngestionDashboard() {
  return (
    <div className="space-y-4">
      <PlatformNotice />
      <SummarySection />
      <div className="grid gap-4 lg:grid-cols-2">
        <DataSourceOverview />
        <DataQualityOverview />
      </div>
    </div>
  );
}
