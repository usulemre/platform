/**
 * Pure Backtesting Engine domain derivations. Deterministic, no IO, no
 * simulation, no metric computation, no optimization. These back the queue,
 * versioning and comparison-assembly capabilities. Metric VALUES are passed
 * through unchanged — never calculated.
 */
import {
  compareVersions,
  isActiveRun,
  type Backtest,
  type BacktestComparison,
  type BacktestVersion,
  type MetricKey,
} from '@platform/backtesting-sdk';

/** The current recommended version — newest by semantic order. */
export function currentVersion(backtest: Backtest): BacktestVersion | null {
  return backtest.versions.reduce<BacktestVersion | null>((best, candidate) => {
    if (!best) return candidate;
    return compareVersions(candidate.version, best.version) > 0 ? candidate : best;
  }, null);
}

/** Backtests with an active run (queued / running / paused) — the execution queue. */
export function executionQueue(backtests: readonly Backtest[]): Backtest[] {
  return backtests.filter((backtest) => isActiveRun(backtest.run.status));
}

/** Backtests awaiting a governance approval decision. */
export function approvalQueue(backtests: readonly Backtest[]): Backtest[] {
  return backtests.filter((backtest) =>
    backtest.approvals.some((approval) => approval.status === 'PENDING'),
  );
}

export interface ComparisonRow {
  readonly backtestId: string;
  readonly backtestName: string;
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
 * Assemble a comparison table by pulling each backtest's supplied metric values.
 * PURE lookup + reshape — NO metric is computed, ranked or scored here.
 */
export function assembleComparison(
  comparison: BacktestComparison,
  backtests: readonly Backtest[],
): AssembledComparison {
  const byId = new Map(backtests.map((backtest) => [backtest.id, backtest]));
  const rows: ComparisonRow[] = comparison.backtestIds.map((backtestId) => {
    const backtest = byId.get(backtestId);
    const metricValues = new Map(
      (backtest?.metrics ?? []).map((metric) => [metric.key, metric.value]),
    );
    const values: Record<string, string> = {};
    for (const key of comparison.metricKeys) values[key] = metricValues.get(key) ?? '—';
    return { backtestId, backtestName: backtest?.name ?? backtestId, values };
  });
  return {
    id: comparison.id,
    name: comparison.name,
    note: comparison.note,
    metricKeys: comparison.metricKeys,
    rows,
  };
}
