/**
 * Pure Performance Analytics Engine domain derivations. Deterministic, no IO, no formulas, no
 * metric calculation, no statistical algorithms. These back the queue, subject-filter,
 * versioning and comparison-assembly capabilities. Metric VALUES are passed through unchanged
 * — never calculated.
 */
import {
  compareVersions,
  type MetricKey,
  type PerformanceComparison,
  type PerformanceReport,
  type ReportVersion,
  type SubjectKind,
} from '@platform/performance-sdk';

/** The current recommended version — newest by semantic order. */
export function currentVersion(report: PerformanceReport): ReportVersion | null {
  return report.versions.reduce<ReportVersion | null>((best, candidate) => {
    if (!best) return candidate;
    return compareVersions(candidate.version, best.version) > 0 ? candidate : best;
  }, null);
}

/** Reports in a review stage — the review queue. */
export function reviewQueue(reports: readonly PerformanceReport[]): PerformanceReport[] {
  return reports.filter(
    (report) => report.stage === 'REVIEW' || report.reviews.some((r) => r.status === 'PENDING'),
  );
}

/** Reports awaiting a governance approval decision. */
export function approvalQueue(reports: readonly PerformanceReport[]): PerformanceReport[] {
  return reports.filter((report) =>
    report.approvals.some((approval) => approval.status === 'PENDING'),
  );
}

/** Reports evaluating a given subject kind. */
export function reportsBySubject(
  reports: readonly PerformanceReport[],
  subjectKind: SubjectKind,
): PerformanceReport[] {
  return reports.filter((report) => report.subjectKind === subjectKind);
}

export interface ComparisonRow {
  readonly reportId: string;
  readonly reportName: string;
  readonly values: Readonly<Record<string, string>>;
}

export interface AssembledComparison {
  readonly id: string;
  readonly name: string;
  readonly note: string;
  readonly metricKeys: readonly MetricKey[];
  readonly rows: readonly ComparisonRow[];
}

/**
 * Assemble a comparison table by pulling each report's supplied metric values. PURE lookup +
 * reshape — NO metric is computed, ranked or scored here.
 */
export function assembleComparison(
  comparison: PerformanceComparison,
  reports: readonly PerformanceReport[],
): AssembledComparison {
  const byId = new Map(reports.map((report) => [report.id, report]));
  const rows: ComparisonRow[] = comparison.reportIds.map((reportId) => {
    const report = byId.get(reportId);
    const metricValues = new Map(
      (report?.metrics ?? []).map((metric) => [metric.key, metric.value]),
    );
    const values: Record<string, string> = {};
    for (const key of comparison.metricKeys) values[key] = metricValues.get(key) ?? '—';
    return { reportId, reportName: report?.name ?? reportId, values };
  });
  return {
    id: comparison.id,
    name: comparison.name,
    note: comparison.note,
    metricKeys: comparison.metricKeys,
    rows,
  };
}
