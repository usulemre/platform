import type { ReactNode } from 'react';
import Link from 'next/link';
import { Waypoints } from 'lucide-react';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@platform/ui';
import type { MetadataRowVm, Tone } from '../domain/view-model';
import type { JobVm } from '../domain/view-model';

const TONE_VARIANT: Record<Tone, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  neutral: 'secondary',
  positive: 'default',
  warning: 'outline',
  danger: 'destructive',
  info: 'outline',
};

/** Presentational status/tone badge. Text label always present (not colour-only). */
export function StatusBadge({ label, tone }: { label: string; tone: Tone }) {
  return <Badge variant={TONE_VARIANT[tone]}>{label}</Badge>;
}

export function IngestionLoading({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-10 w-full" />
      ))}
    </div>
  );
}

export function IngestionEmpty({ label }: { label: string }) {
  return <p className="py-4 text-sm text-muted-foreground">{label}</p>;
}

export function IngestionError({ onRetry }: { onRetry?: () => void }) {
  return (
    <Alert variant="destructive" title="Unable to load ingestion data">
      <div className="space-y-2">
        <p>
          The ingestion service could not be reached. This is expected until the backend is
          available.
        </p>
        {onRetry ? (
          <Button size="sm" variant="outline" onClick={onRetry}>
            Retry
          </Button>
        ) : null}
      </div>
    </Alert>
  );
}

/** Platform note: ingestion receives data only via connector abstractions. */
export function PlatformNotice() {
  return (
    <div
      role="note"
      className="flex items-start gap-2 rounded-md border border-muted-foreground/30 bg-muted/40 px-3 py-2 text-sm text-muted-foreground"
    >
      <Waypoints className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <p>
        The single entry point for all external data. Pipelines receive raw data{' '}
        <span className="font-medium text-foreground">only through connector abstractions</span> and
        transform it into canonical datasets. This console is read-only — it never talks to
        providers, a broker, or storage.
      </p>
    </div>
  );
}

export function InfoCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function KeyValueList({ rows }: { rows: readonly MetadataRowVm[] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
      {rows.map((row) => (
        <div key={row.label} className="flex justify-between gap-4 border-b py-1 text-sm">
          <dt className="text-muted-foreground">{row.label}</dt>
          <dd className="font-medium">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Shared jobs table used by pipeline details, failed jobs and the retry queue. */
export function JobsTable({ jobs, emptyLabel }: { jobs: readonly JobVm[]; emptyLabel: string }) {
  if (jobs.length === 0) return <IngestionEmpty label={emptyLabel} />;
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Ingestion jobs</caption>
        <thead className="border-b bg-muted/50 text-xs uppercase text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-2">
              Job
            </th>
            <th scope="col" className="px-4 py-2">
              Pipeline
            </th>
            <th scope="col" className="px-4 py-2">
              Stage
            </th>
            <th scope="col" className="px-4 py-2">
              Attempt
            </th>
            <th scope="col" className="px-4 py-2">
              Enqueued
            </th>
            <th scope="col" className="px-4 py-2">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.id} className="border-b last:border-0 align-top hover:bg-accent/50">
              <th scope="row" className="px-4 py-2 font-mono text-xs">
                {job.id}
              </th>
              <td className="px-4 py-2">
                <Link
                  href={`/data-ingestion/${job.pipelineId}`}
                  className="font-medium hover:underline"
                >
                  {job.pipelineName}
                </Link>
                {job.error ? <p className="text-xs text-muted-foreground">{job.error}</p> : null}
              </td>
              <td className="px-4 py-2">{job.stageLabel}</td>
              <td className="px-4 py-2 tabular-nums">{job.attemptLabel}</td>
              <td className="px-4 py-2">{job.enqueuedLabel}</td>
              <td className="px-4 py-2">
                <StatusBadge label={job.status.label} tone={job.status.tone} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
