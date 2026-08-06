'use client';

import Link from 'next/link';
import { useHistory } from '../hooks/use-execution-simulator';
import {
  ExecutionEmpty,
  ExecutionError,
  ExecutionLoading,
  InfoCard,
  StatusBadge,
} from './execution-atoms';

/** Simulation History — completed and archived simulation sessions. */
export function SimulationHistory() {
  const { data, isLoading, isError, refetch } = useHistory();
  if (isLoading) return <ExecutionLoading />;
  if (isError) return <ExecutionError onRetry={() => refetch()} />;
  if (!data || data.length === 0)
    return <ExecutionEmpty label="No completed or archived sessions." />;

  return (
    <InfoCard title="Simulation history">
      <ul className="space-y-2 text-sm">
        {data.map((session) => (
          <li
            key={session.id}
            className="flex flex-wrap items-center justify-between gap-2 border-b py-2"
          >
            <span className="min-w-0">
              <Link
                href={`/execution-simulator/${session.id}`}
                className="font-medium hover:underline"
              >
                {session.name}
              </Link>
              <span className="ml-2 text-xs text-muted-foreground">
                {session.namespace} / {session.family} · v{session.version} · {session.owner} ·
                updated {session.updatedLabel}
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <StatusBadge label={session.run.label} tone={session.run.tone} />
              <StatusBadge label={session.stage.label} tone={session.stage.tone} />
            </span>
          </li>
        ))}
      </ul>
    </InfoCard>
  );
}
