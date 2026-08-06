'use client';

import { useMemo } from 'react';
import { useRiskAssessments } from '../hooks/use-risk';
import { useRiskQueryStore } from '../hooks/use-risk-query-store';
import type { RiskQuery } from '../domain/query';
import { RiskToolbar } from './risk-toolbar';
import { RiskAssessmentList } from './risk-assessment-list';
import { RiskEmptyState } from './risk-empty-state';
import { RiskLoadingState } from './risk-loading-state';
import { RiskErrorState } from './risk-error-state';

/** Risk assessment list container. Derives the query from UI state and calls the
 *  application service via the query hook; selects the presentational state. */
export function RiskAssessmentsView() {
  const search = useRiskQueryStore((state) => state.search);
  const status = useRiskQueryStore((state) => state.status);
  const subjectKind = useRiskQueryStore((state) => state.subjectKind);
  const sortBy = useRiskQueryStore((state) => state.sortBy);
  const sortDir = useRiskQueryStore((state) => state.sortDir);

  const query = useMemo<RiskQuery>(
    () => ({ search, status, subjectKind, sortBy, sortDir }),
    [search, status, subjectKind, sortBy, sortDir],
  );

  const { data, isLoading, isError, refetch } = useRiskAssessments(query);

  return (
    <div className="space-y-4">
      <RiskToolbar />
      {isLoading ? (
        <RiskLoadingState />
      ) : isError ? (
        <RiskErrorState onRetry={() => void refetch()} />
      ) : !data || data.length === 0 ? (
        <RiskEmptyState />
      ) : (
        <RiskAssessmentList assessments={data} />
      )}
    </div>
  );
}
