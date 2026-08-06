import type { Metadata } from 'next';
import { MetricCatalog } from '@/modules/performance-analytics';

export const metadata: Metadata = { title: 'Metric catalog · Research Platform' };

/** Metric Catalog + Explorer page. */
export default function MetricCatalogPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Metric catalog</h1>
      <p className="max-w-prose text-muted-foreground">
        The 20 canonical metric definitions across return, risk, risk-adjusted, drawdown, trade,
        exposure and benchmark-relative categories. Definitions only — nothing is computed here.
      </p>
      <MetricCatalog />
    </div>
  );
}
