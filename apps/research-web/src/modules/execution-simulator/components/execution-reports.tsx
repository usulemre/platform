'use client';

import Link from 'next/link';
import { useReports } from '../hooks/use-execution-simulator';
import {
  ExecutionEmpty,
  ExecutionError,
  ExecutionLoading,
  InfoCard,
  StatusBadge,
} from './execution-atoms';

/** Execution Reports — every generated report reference across sessions. */
export function ExecutionReports() {
  const { data, isLoading, isError, refetch } = useReports();
  if (isLoading) return <ExecutionLoading />;
  if (isError) return <ExecutionError onRetry={() => refetch()} />;
  if (!data || data.length === 0) return <ExecutionEmpty label="No reports generated." />;

  return (
    <InfoCard title="Execution reports">
      <ul className="space-y-1 text-sm">
        {data.map((report) => (
          <li key={report.id} className="flex items-start justify-between gap-4 border-b py-1.5">
            <span>
              <span className="font-medium">{report.title}</span>{' '}
              <StatusBadge label={report.kind} tone="info" />
              <p className="text-xs text-muted-foreground">{report.summary}</p>
              <span className="text-xs text-muted-foreground">
                <Link href={`/execution-simulator/${report.sessionId}`} className="hover:underline">
                  {report.sessionName}
                </Link>
                {' · '}
                <span className="font-mono">{report.ref}</span>
              </span>
            </span>
            <span className="text-xs text-muted-foreground">{report.generatedLabel}</span>
          </li>
        ))}
      </ul>
      <p role="note" className="mt-3 text-xs text-muted-foreground">
        Report artifacts live in the artifact store; only references are surfaced here.
      </p>
    </InfoCard>
  );
}
