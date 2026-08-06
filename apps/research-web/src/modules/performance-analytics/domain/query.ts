/**
 * Report query model + pure query application (search / filter / sort). Data-layer logic, not
 * UI logic. Deterministic — mirrors the service's pure discovery/search so both tiers behave
 * identically.
 */
import type { PerformanceReport, ReportStage, SubjectKind } from '@platform/performance-sdk';

export type ReportSortField = 'name' | 'family' | 'updatedAt';
export type SortDir = 'asc' | 'desc';

export interface ReportQuery {
  readonly search?: string;
  readonly namespace?: string | 'ALL';
  readonly stage?: ReportStage | 'ALL';
  readonly subjectKind?: SubjectKind | 'ALL';
  readonly tag?: string;
  readonly sortBy?: ReportSortField;
  readonly sortDir?: SortDir;
}

export function applyReportQuery(
  data: readonly PerformanceReport[],
  query: ReportQuery,
): PerformanceReport[] {
  const search = query.search?.trim().toLowerCase() ?? '';
  const namespace = query.namespace ?? 'ALL';
  const stage = query.stage ?? 'ALL';
  const subjectKind = query.subjectKind ?? 'ALL';
  const tag = query.tag?.trim().toLowerCase() ?? '';
  const sortBy = query.sortBy ?? 'name';
  const sortDir = query.sortDir ?? 'asc';

  const filtered = data.filter((report) => {
    if (namespace !== 'ALL' && report.namespace !== namespace) return false;
    if (stage !== 'ALL' && report.stage !== stage) return false;
    if (subjectKind !== 'ALL' && report.subjectKind !== subjectKind) return false;
    if (tag && !report.tags.some((t) => t.toLowerCase() === tag)) return false;
    if (search) {
      const haystack =
        `${report.name} ${report.namespace} ${report.family} ${report.subjectName} ${report.owner.owner} ${report.tags.join(' ')}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'family')
      comparison = `${a.namespace}/${a.family}`.localeCompare(`${b.namespace}/${b.family}`);
    else if (sortBy === 'updatedAt') comparison = a.updatedAt.localeCompare(b.updatedAt);
    else comparison = a.name.localeCompare(b.name);
    return sortDir === 'asc' ? comparison : -comparison;
  });

  return sorted;
}
