'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Input } from '@platform/ui';
import { RISK_STAGES, describeStage } from '@platform/risk-sdk';
import { useAssessments } from '../hooks/use-risk-engine';
import { useRiskQueryStore } from '../hooks/use-risk-query-store';
import type { RiskStage } from '../domain/dto';
import type { RiskQuery, RiskSortField } from '../domain/query';
import type { RiskListItemVm } from '../domain/view-model';
import { RiskEmpty, RiskError, RiskLoading, StatusBadge } from './risk-engine-atoms';

const NAMESPACE_OPTIONS: readonly string[] = ['ALL', 'equities', 'multi-asset', 'credit', 'fx'];
const STAGE_OPTIONS: readonly (RiskStage | 'ALL')[] = ['ALL', ...RISK_STAGES];
const SORT_OPTIONS: readonly { value: RiskSortField; label: string }[] = [
  { value: 'name', label: 'Name' },
  { value: 'family', label: 'Family' },
  { value: 'updatedAt', label: 'Last updated' },
];

const selectClass =
  'h-10 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

function humanize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase().replace(/[_-]/g, ' ');
}

function AssessmentCard({ assessment }: { assessment: RiskListItemVm }) {
  return (
    <li className="rounded-lg border p-4 hover:bg-accent/40">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <Link href={`/risk-engine/${assessment.id}`} className="font-medium hover:underline">
            {assessment.name}
          </Link>
          <p className="text-xs text-muted-foreground">
            {assessment.namespace} / {assessment.family} · {assessment.subjectName} · v
            {assessment.version}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <StatusBadge label={assessment.decision.label} tone={assessment.decision.tone} />
          <StatusBadge label={assessment.stage.label} tone={assessment.stage.tone} />
        </div>
      </div>
      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{assessment.description}</p>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <StatusBadge
          label={`Validation: ${assessment.validation.label}`}
          tone={assessment.validation.tone}
        />
        <StatusBadge
          label={`Approval: ${assessment.approval.label}`}
          tone={assessment.approval.tone}
        />
        {assessment.openExceptions > 0 ? (
          <StatusBadge
            label={`${assessment.openExceptions} open exception${assessment.openExceptions === 1 ? '' : 's'}`}
            tone="warning"
          />
        ) : null}
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>{assessment.owner}</span>
        <span>updated {assessment.updatedLabel}</span>
      </div>
    </li>
  );
}

/** Risk Registry Explorer — search / filter / sort over the registry. */
export function RiskRegistry() {
  const search = useRiskQueryStore((state) => state.search);
  const namespace = useRiskQueryStore((state) => state.namespace);
  const stage = useRiskQueryStore((state) => state.stage);
  const sortBy = useRiskQueryStore((state) => state.sortBy);
  const sortDir = useRiskQueryStore((state) => state.sortDir);
  const setSearch = useRiskQueryStore((state) => state.setSearch);
  const setNamespace = useRiskQueryStore((state) => state.setNamespace);
  const setStage = useRiskQueryStore((state) => state.setStage);
  const setSort = useRiskQueryStore((state) => state.setSort);

  const query = useMemo<RiskQuery>(
    () => ({ search, namespace, stage, sortBy, sortDir }),
    [search, namespace, stage, sortBy, sortDir],
  );
  const { data, isLoading, isError, refetch } = useAssessments(query);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Input
          aria-label="Search assessments"
          placeholder="Search risk assessments…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="sm:max-w-xs"
        />
        <select
          aria-label="Filter by namespace"
          className={selectClass}
          value={namespace}
          onChange={(event) => setNamespace(event.target.value)}
        >
          {NAMESPACE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option === 'ALL' ? 'All namespaces' : humanize(option)}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by stage"
          className={selectClass}
          value={stage}
          onChange={(event) => setStage(event.target.value as RiskStage | 'ALL')}
        >
          {STAGE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option === 'ALL' ? 'All stages' : describeStage(option).label}
            </option>
          ))}
        </select>
        <select
          aria-label="Sort by"
          className={selectClass}
          value={sortBy}
          onChange={(event) => setSort(event.target.value as RiskSortField)}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <RiskLoading />
      ) : isError ? (
        <RiskError onRetry={() => refetch()} />
      ) : !data || data.length === 0 ? (
        <RiskEmpty label="No assessments match your filters." />
      ) : (
        <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {data.map((assessment) => (
            <AssessmentCard key={assessment.id} assessment={assessment} />
          ))}
        </ul>
      )}
    </div>
  );
}
