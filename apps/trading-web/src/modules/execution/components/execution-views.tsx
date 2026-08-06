'use client';

import type { ExecutionScope } from '../domain/query';
import { useExecutions } from '../hooks/use-execution';
import { ExecError, ExecLoading, InfoCard } from './execution-atoms';
import { ExecutionTable } from './execution-table';

/** A scoped execution list (Queue / History / etc.). */
export function ExecutionScopeView({
  scope,
  title,
  emptyLabel,
}: {
  scope: ExecutionScope;
  title: string;
  emptyLabel: string;
}) {
  const { data, isLoading, isError, refetch } = useExecutions({ scope });
  if (isLoading) return <ExecLoading />;
  if (isError) return <ExecError onRetry={() => refetch()} />;
  return (
    <InfoCard
      title={title}
      action={<span className="text-xs text-muted-foreground">{data?.length ?? 0} executions</span>}
    >
      <ExecutionTable rows={data ?? []} emptyLabel={emptyLabel} />
    </InfoCard>
  );
}
