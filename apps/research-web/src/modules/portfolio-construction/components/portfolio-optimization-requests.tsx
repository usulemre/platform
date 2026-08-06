'use client';

import { useOptimizationRequests } from '../hooks/use-portfolio-construction';
import {
  PortfolioConstructionEmpty,
  PortfolioConstructionError,
  PortfolioConstructionLoading,
  InfoCard,
  StatusBadge,
} from './portfolio-construction-atoms';

/** Portfolio Optimization Requests — the active optimization requests across portfolios. */
export function PortfolioOptimizationRequests() {
  const { data, isLoading, isError, refetch } = useOptimizationRequests();
  if (isLoading) return <PortfolioConstructionLoading />;
  if (isError) return <PortfolioConstructionError onRetry={() => refetch()} />;
  if (!data || data.length === 0)
    return <PortfolioConstructionEmpty label="No active optimization requests." />;

  return (
    <InfoCard title="Optimization requests">
      <ul className="space-y-2 text-sm">
        {data.map((request) => (
          <li
            key={request.id}
            className="flex flex-wrap items-center justify-between gap-2 border-b py-2"
          >
            <span className="min-w-0">
              <span className="font-medium">{request.portfolioName}</span>
              <span className="ml-2 text-xs text-muted-foreground">
                {request.namespace} / {request.family} · objective {request.objective} ·{' '}
                {request.owner} · {request.progressPercent}%
              </span>
            </span>
            <StatusBadge label={request.status.label} tone={request.status.tone} />
          </li>
        ))}
      </ul>
      <p role="note" className="mt-3 text-xs text-muted-foreground">
        Optimization runs in the external optimizer; this console requests and reflects state — it
        never optimizes or computes weights.
      </p>
    </InfoCard>
  );
}
