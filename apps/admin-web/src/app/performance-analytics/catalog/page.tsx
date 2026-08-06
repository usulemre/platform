import type { Metadata } from 'next';
import { MetricCatalog } from '@/modules/performance-analytics';

export const metadata: Metadata = { title: 'Metric registry · Admin' };

/** Metric Registry / Catalog page. */
export default function MetricRegistryPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Metric registry</h1>
      <p className="max-w-prose text-muted-foreground">
        The canonical, versioned metric definitions across all categories. Definitions only —
        nothing is computed here.
      </p>
      <MetricCatalog />
    </div>
  );
}
