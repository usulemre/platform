'use client';

import type { RoutingScope } from '../domain/query';
import { useRoutings } from '../hooks/use-sor';
import { InfoCard, SorError, SorLoading } from './sor-atoms';
import { RoutingTable } from './routing-table';

/** A scoped routing list (History / Ready / Failed / etc.). */
export function RoutingScopeView({
  scope,
  title,
  emptyLabel,
}: {
  scope: RoutingScope;
  title: string;
  emptyLabel: string;
}) {
  const { data, isLoading, isError, refetch } = useRoutings({ scope });
  if (isLoading) return <SorLoading />;
  if (isError) return <SorError onRetry={() => refetch()} />;
  return (
    <InfoCard
      title={title}
      action={<span className="text-xs text-muted-foreground">{data?.length ?? 0} routings</span>}
    >
      <RoutingTable rows={data ?? []} emptyLabel={emptyLabel} />
    </InfoCard>
  );
}
