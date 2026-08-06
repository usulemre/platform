'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@platform/ui';
import { NotFound } from '@platform/shell';
import { useRiskAssessment } from '../hooks/use-risk';
import { RiskStatusBadge } from './risk-status-badge';
import { AdvisoryNotice } from './advisory-notice';
import { RiskMetadataPanel } from './risk-metadata-panel';
import { IndicatorList } from './indicator-list';
import { StrategyRiskSummary } from './strategy-risk-summary';
import { RiskValidationSummary } from './risk-validation-summary';
import { RiskDecisionTimeline } from './risk-decision-timeline';
import { GovernanceReferences } from './governance-references';
import { RiskLoadingState } from './risk-loading-state';
import { RiskErrorState } from './risk-error-state';

/** Risk assessment details container. Orchestrates the detail query and lays out
 *  the portfolio/strategy risk summaries, exposure overview, constraint
 *  compliance, validation, decision timeline and governance references. Advisory
 *  only — the advisory notice is always shown. */
export function RiskAssessmentDetailView({ assessmentId }: { assessmentId: string }) {
  const { data, isLoading, isError, refetch } = useRiskAssessment(assessmentId);

  if (isLoading) return <RiskLoadingState />;
  if (isError) return <RiskErrorState onRetry={() => void refetch()} />;
  if (!data) {
    return (
      <NotFound
        title="Risk assessment not found"
        description="No risk assessment matches this identifier."
        homeHref="/risk"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="sm" aria-label="Back to risk assessments">
          <Link href="/risk">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold text-foreground">{data.title}</h1>
        <RiskStatusBadge label={data.verdict.label} tone={data.verdict.tone} />
        <RiskStatusBadge label={data.riskLevel.label} tone={data.riskLevel.tone} />
        <RiskStatusBadge label={data.status.label} tone={data.status.tone} />
      </div>
      <p className="max-w-prose text-muted-foreground">
        Subject:{' '}
        {data.subject.href ? (
          <Link href={data.subject.href} className="font-medium text-foreground hover:underline">
            {data.subject.kindLabel} · {data.subject.name}
          </Link>
        ) : (
          <span className="font-medium text-foreground">
            {data.subject.kindLabel} · {data.subject.name}
          </span>
        )}
      </p>
      <AdvisoryNotice />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RiskMetadataPanel rows={data.metadata} />
        <IndicatorList
          title="Portfolio risk summary"
          indicators={data.portfolioRisk}
          emptyLabel="No portfolio-level risk indicators for this subject."
        />
        <StrategyRiskSummary strategyRisk={data.strategyRisk} />
        <IndicatorList
          title="Exposure overview"
          indicators={data.exposures}
          emptyLabel="No exposures recorded."
        />
        <IndicatorList
          title="Constraint compliance"
          indicators={data.constraints}
          emptyLabel="No constraint checks recorded."
        />
        <RiskValidationSummary validation={data.validation} />
        <RiskDecisionTimeline steps={data.timeline} />
        <GovernanceReferences
          policyRefs={data.policyRefs}
          exceptions={data.exceptions}
          workflow={data.workflow}
          executionRecommendation={data.executionRecommendation}
        />
      </div>
    </div>
  );
}
