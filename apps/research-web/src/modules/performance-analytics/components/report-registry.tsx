'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Input } from '@platform/ui';
import { REPORT_STAGES, describeStage } from '@platform/performance-sdk';
import { useReports } from '../hooks/use-performance';
import { useReportQueryStore } from '../hooks/use-report-query-store';
import type { ReportStage, SubjectKind } from '../domain/dto';
import type { ReportQuery, ReportSortField } from '../domain/query';
import type { ReportListItemVm } from '../domain/view-model';
import {
  PerformanceEmpty,
  PerformanceError,
  PerformanceLoading,
  StatusBadge,
} from './performance-atoms';

const NAMESPACE_OPTIONS: readonly string[] = ['ALL', 'equities', 'fx', 'crypto'];
const STAGE_OPTIONS: readonly (ReportStage | 'ALL')[] = ['ALL', ...REPORT_STAGES];
const SUBJECT_OPTIONS: readonly { value: SubjectKind | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All subjects' },
  { value: 'STRATEGY', label: 'Strategy' },
  { value: 'PORTFOLIO', label: 'Portfolio' },
  { value: 'BACKTEST', label: 'Backtest' },
  { value: 'LIVE_SESSION', label: 'Live session' },
  { value: 'SIMULATION', label: 'Simulation' },
];
const SORT_OPTIONS: readonly { value: ReportSortField; label: string }[] = [
  { value: 'name', label: 'Name' },
  { value: 'family', label: 'Family' },
  { value: 'updatedAt', label: 'Last updated' },
];

const selectClass =
  'h-10 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

function humanize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase().replace(/[_-]/g, ' ');
}

function ReportCard({ report }: { report: ReportListItemVm }) {
  return (
    <li className="rounded-lg border p-4 hover:bg-accent/40">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <Link
            href={`/performance-analytics/${report.id}`}
            className="font-medium hover:underline"
          >
            {report.name}
          </Link>
          <p className="text-xs text-muted-foreground">
            {report.namespace} / {report.family} · {report.subjectName} · v{report.version}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <StatusBadge label={report.subject.label} tone={report.subject.tone} />
          <StatusBadge label={report.stage.label} tone={report.stage.tone} />
        </div>
      </div>
      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{report.description}</p>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <StatusBadge
          label={`Computation: ${report.computation.label}`}
          tone={report.computation.tone}
        />
        <StatusBadge
          label={`Validation: ${report.validation.label}`}
          tone={report.validation.tone}
        />
        <StatusBadge label={`Approval: ${report.approval.label}`} tone={report.approval.tone} />
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>{report.owner}</span>
        <span>updated {report.updatedLabel}</span>
      </div>
    </li>
  );
}

/** Performance Reports registry — search / filter / sort over the registry. */
export function ReportRegistry() {
  const search = useReportQueryStore((state) => state.search);
  const namespace = useReportQueryStore((state) => state.namespace);
  const stage = useReportQueryStore((state) => state.stage);
  const subjectKind = useReportQueryStore((state) => state.subjectKind);
  const sortBy = useReportQueryStore((state) => state.sortBy);
  const sortDir = useReportQueryStore((state) => state.sortDir);
  const setSearch = useReportQueryStore((state) => state.setSearch);
  const setNamespace = useReportQueryStore((state) => state.setNamespace);
  const setStage = useReportQueryStore((state) => state.setStage);
  const setSubjectKind = useReportQueryStore((state) => state.setSubjectKind);
  const setSort = useReportQueryStore((state) => state.setSort);

  const query = useMemo<ReportQuery>(
    () => ({ search, namespace, stage, subjectKind, sortBy, sortDir }),
    [search, namespace, stage, subjectKind, sortBy, sortDir],
  );
  const { data, isLoading, isError, refetch } = useReports(query);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Input
          aria-label="Search reports"
          placeholder="Search performance reports…"
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
          aria-label="Filter by subject"
          className={selectClass}
          value={subjectKind}
          onChange={(event) => setSubjectKind(event.target.value as SubjectKind | 'ALL')}
        >
          {SUBJECT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by stage"
          className={selectClass}
          value={stage}
          onChange={(event) => setStage(event.target.value as ReportStage | 'ALL')}
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
          onChange={(event) => setSort(event.target.value as ReportSortField)}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <PerformanceLoading />
      ) : isError ? (
        <PerformanceError onRetry={() => refetch()} />
      ) : !data || data.length === 0 ? (
        <PerformanceEmpty label="No reports match your filters." />
      ) : (
        <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {data.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </ul>
      )}
    </div>
  );
}
