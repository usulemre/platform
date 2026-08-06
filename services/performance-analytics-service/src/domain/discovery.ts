/**
 * Pure Performance Analytics Engine discovery/search. Deterministic, no IO. Backs the
 * registry and report-explorer capabilities — no ranking model, no formulas, no metric
 * calculation.
 */
import {
  reportKey,
  type PerformanceReport,
  type ReportStage,
  type SubjectKind,
} from '@platform/performance-sdk';

export interface ReportSearch {
  readonly search?: string;
  readonly namespace?: string;
  readonly family?: string;
  readonly stage?: ReportStage | 'ALL';
  readonly subjectKind?: SubjectKind | 'ALL';
  readonly tag?: string;
}

export function searchReports(
  reports: readonly PerformanceReport[],
  query: ReportSearch,
): PerformanceReport[] {
  const search = query.search?.trim().toLowerCase() ?? '';
  const namespace = query.namespace ?? 'ALL';
  const family = query.family ?? 'ALL';
  const stage = query.stage ?? 'ALL';
  const subjectKind = query.subjectKind ?? 'ALL';
  const tag = query.tag?.trim().toLowerCase() ?? '';

  return reports
    .filter((report) => {
      if (namespace !== 'ALL' && report.namespace !== namespace) return false;
      if (family !== 'ALL' && report.family !== family) return false;
      if (stage !== 'ALL' && report.stage !== stage) return false;
      if (subjectKind !== 'ALL' && report.subjectKind !== subjectKind) return false;
      if (tag && !report.tags.some((t) => t.toLowerCase() === tag)) return false;
      if (search) {
        const haystack =
          `${report.name} ${report.namespace} ${report.family} ${report.subjectName} ${report.owner.owner} ${report.tags.join(' ')}`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Resolve a report by its canonical `namespace/family/name` key. */
export function resolveByKey(
  reports: readonly PerformanceReport[],
  key: string,
): PerformanceReport | null {
  const needle = key.trim().toLowerCase();
  return (
    reports.find((report) => reportKey(report.namespace, report.family, report.name) === needle) ??
    null
  );
}
