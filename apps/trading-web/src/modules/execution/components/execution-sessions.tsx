'use client';

import { useSessions } from '../hooks/use-execution';
import { ExecError, ExecLoading, InfoCard, StatusBadge } from './execution-atoms';

/** Execution Sessions — governed batches/runs of executions. */
export function ExecutionSessions() {
  const { data, isLoading, isError, refetch } = useSessions();
  if (isLoading) return <ExecLoading />;
  if (isError) return <ExecError onRetry={() => refetch()} />;
  return (
    <InfoCard
      title="Execution sessions"
      action={<span className="text-xs text-muted-foreground">{data?.length ?? 0} sessions</span>}
    >
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-1.5 text-left font-medium">Session</th>
              <th className="px-3 py-1.5 text-left font-medium">Mode</th>
              <th className="px-3 py-1.5 text-left font-medium">Status</th>
              <th className="px-3 py-1.5 text-right font-medium">Executions</th>
              <th className="px-3 py-1.5 text-left font-medium">Opened</th>
              <th className="px-3 py-1.5 text-left font-medium">Note</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((session) => (
              <tr key={session.id} className="border-t">
                <td className="px-3 py-1 font-medium">{session.label}</td>
                <td className="px-3 py-1">
                  <StatusBadge label={session.mode.label} tone={session.mode.tone} />
                </td>
                <td className="px-3 py-1">
                  <StatusBadge label={session.status.label} tone={session.status.tone} />
                </td>
                <td className="px-3 py-1 text-right font-mono">{session.executionCount}</td>
                <td className="px-3 py-1 font-mono text-xs text-muted-foreground">
                  {session.openedLabel}
                </td>
                <td className="px-3 py-1 text-muted-foreground">{session.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </InfoCard>
  );
}
