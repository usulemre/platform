import type { Metadata } from 'next';
import Link from 'next/link';
import { PerformanceDashboard, ReportRegistry } from '@/modules/performance-analytics';

export const metadata: Metadata = { title: 'Performance analytics · Research Platform' };

/** Performance Analytics Engine — Dashboard + Reports registry (Server Component). The
 *  interactive parts are Client Components that fetch through the application service. */
export default function PerformanceAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground">Performance analytics</h1>
          <p className="max-w-prose text-muted-foreground">
            The canonical analytics engine for evaluating strategies, portfolios, backtests and live
            trading sessions — standardized metric definitions, reporting models and evaluation
            workflows. Metric values are computed by the analytics runtime and reflected here;
            nothing is calculated by this console.
          </p>
        </div>
        <nav className="flex flex-wrap gap-2 text-sm" aria-label="Performance analytics sections">
          <Link
            href="/performance-analytics/catalog"
            className="rounded-md border px-3 py-1.5 hover:bg-accent"
          >
            Metric catalog
          </Link>
          <Link
            href="/performance-analytics/comparisons"
            className="rounded-md border px-3 py-1.5 hover:bg-accent"
          >
            Comparisons
          </Link>
        </nav>
      </div>
      <PerformanceDashboard />
      <ReportRegistry />
    </div>
  );
}
