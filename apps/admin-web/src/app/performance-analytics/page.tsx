import type { Metadata } from 'next';
import Link from 'next/link';
import { PerformanceDashboard, ReportRegistry } from '@/modules/performance-analytics';

export const metadata: Metadata = { title: 'Performance Analytics · Admin' };

/** Performance Analytics Engine (admin) — Dashboard + Reports registry (Server Component). */
export default function PerformanceAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground">Performance Analytics</h1>
          <p className="max-w-prose text-muted-foreground">
            The canonical analytics engine. Administer the versioned metric registry, review and
            approve performance reports, manage benchmarks and compare performance — never
            calculating a metric.
          </p>
        </div>
        <nav className="flex flex-wrap gap-2 text-sm" aria-label="Performance analytics sections">
          <Link
            href="/performance-analytics/catalog"
            className="rounded-md border px-3 py-1.5 hover:bg-accent"
          >
            Metric registry
          </Link>
          <Link
            href="/performance-analytics/review"
            className="rounded-md border px-3 py-1.5 hover:bg-accent"
          >
            Review
          </Link>
          <Link
            href="/performance-analytics/benchmarks"
            className="rounded-md border px-3 py-1.5 hover:bg-accent"
          >
            Benchmarks
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
