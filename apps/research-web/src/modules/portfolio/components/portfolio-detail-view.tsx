'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@platform/ui';
import { NotFound } from '@platform/shell';
import { usePortfolio } from '../hooks/use-portfolios';
import { PortfolioStatusBadge } from './portfolio-status-badge';
import { AdvisoryNotice } from './advisory-notice';
import { PortfolioMetadataPanel } from './portfolio-metadata-panel';
import { StrategyComposition } from './strategy-composition';
import { AllocationSummary } from './allocation-summary';
import { PortfolioHoldings } from './portfolio-holdings';
import { ConstraintSummary } from './constraint-summary';
import { PortfolioRiskSummary } from './portfolio-risk-summary';
import { PortfolioValidationSummary } from './portfolio-validation-summary';
import { PortfolioWorkflowStatus } from './portfolio-workflow-status';
import { PerformancePlaceholder } from './performance-placeholder';
import { RebalanceHistoryPlaceholder } from './rebalance-history-placeholder';
import { PortfolioVersionsPanel } from './portfolio-versions-panel';
import { PortfolioLineagePanel } from './portfolio-lineage-panel';
import { ReferenceList } from './reference-list';
import { PortfolioLoadingState } from './portfolio-loading-state';
import { PortfolioErrorState } from './portfolio-error-state';

/** Portfolio details container. Orchestrates the detail query and lays out the
 *  holdings, allocation, composition, constraint, risk, performance, rebalance,
 *  validation, workflow, snapshot and traceability panels. Portfolios are
 *  advisory — the advisory notice is always shown. */
export function PortfolioDetailView({ portfolioId }: { portfolioId: string }) {
  const { data, isLoading, isError, refetch } = usePortfolio(portfolioId);

  if (isLoading) return <PortfolioLoadingState />;
  if (isError) return <PortfolioErrorState onRetry={() => void refetch()} />;
  if (!data) {
    return (
      <NotFound
        title="Portfolio not found"
        description="No portfolio matches this identifier."
        homeHref="/portfolios"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="sm" aria-label="Back to portfolios">
          <Link href="/portfolios">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold text-foreground">{data.name}</h1>
        <PortfolioStatusBadge label={data.status.label} tone={data.status.tone} />
        <PortfolioStatusBadge label={data.deployment.label} tone={data.deployment.tone} />
      </div>
      <p className="max-w-prose text-muted-foreground">{data.description}</p>
      <AdvisoryNotice />

      <PortfolioHoldings holdings={data.holdings} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PortfolioMetadataPanel rows={data.metadata} />
        <AllocationSummary allocations={data.allocations} />
        <StrategyComposition composition={data.composition} />
        <ConstraintSummary constraints={data.constraints} />
        <PortfolioRiskSummary risk={data.risk} />
        <PortfolioValidationSummary validation={data.validation} />
        <PortfolioWorkflowStatus
          approval={data.approval}
          deployment={data.deployment}
          workflow={data.workflow}
        />
        <PerformancePlaceholder backtestRef={data.backtestRef} />
        <RebalanceHistoryPlaceholder />
        <ReferenceList
          title="Traceability (experiments)"
          references={data.experimentRefs}
          emptyLabel="No originating experiments."
        />
        <PortfolioVersionsPanel versions={data.versions} />
        <PortfolioLineagePanel lineage={data.lineage} />
      </div>
    </div>
  );
}
