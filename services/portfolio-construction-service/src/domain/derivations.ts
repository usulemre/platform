/**
 * Pure Portfolio Construction Engine domain derivations. Deterministic, no IO, no
 * optimization, no weight/risk computation. These back the queue, versioning and
 * comparison-assembly capabilities. Metric VALUES are passed through unchanged —
 * never calculated.
 */
import {
  compareVersions,
  isActiveOptimization,
  type Portfolio,
  type PortfolioComparison,
  type PortfolioVersion,
  type MetricKey,
} from '@platform/portfolio-sdk';

/** The current recommended version — newest by semantic order. */
export function currentVersion(portfolio: Portfolio): PortfolioVersion | null {
  return portfolio.versions.reduce<PortfolioVersion | null>((best, candidate) => {
    if (!best) return candidate;
    return compareVersions(candidate.version, best.version) > 0 ? candidate : best;
  }, null);
}

/** Portfolios with an active optimization request (queued / running) — the optimization queue. */
export function optimizationQueue(portfolios: readonly Portfolio[]): Portfolio[] {
  return portfolios.filter((portfolio) => isActiveOptimization(portfolio.optimization.status));
}

/** Portfolios awaiting a governance approval decision. */
export function approvalQueue(portfolios: readonly Portfolio[]): Portfolio[] {
  return portfolios.filter((portfolio) =>
    portfolio.approvals.some((approval) => approval.status === 'PENDING'),
  );
}

export interface ComparisonRow {
  readonly portfolioId: string;
  readonly portfolioName: string;
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
 * Assemble a comparison table by pulling each portfolio's supplied metric values.
 * PURE lookup + reshape — NO metric is computed, ranked or scored here.
 */
export function assembleComparison(
  comparison: PortfolioComparison,
  portfolios: readonly Portfolio[],
): AssembledComparison {
  const byId = new Map(portfolios.map((portfolio) => [portfolio.id, portfolio]));
  const rows: ComparisonRow[] = comparison.portfolioIds.map((portfolioId) => {
    const portfolio = byId.get(portfolioId);
    const metricValues = new Map(
      (portfolio?.metrics ?? []).map((metric) => [metric.key, metric.value]),
    );
    const values: Record<string, string> = {};
    for (const key of comparison.metricKeys) values[key] = metricValues.get(key) ?? '—';
    return { portfolioId, portfolioName: portfolio?.name ?? portfolioId, values };
  });
  return {
    id: comparison.id,
    name: comparison.name,
    note: comparison.note,
    metricKeys: comparison.metricKeys,
    rows,
  };
}
