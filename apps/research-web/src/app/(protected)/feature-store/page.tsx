import type { Metadata } from 'next';
import Link from 'next/link';
import { FeatureStoreDashboard, FeatureCatalog } from '@/modules/feature-store';

export const metadata: Metadata = { title: 'Feature store · Research Platform' };

/** Feature Store — Dashboard + Catalog/Explorer (Server Component). The
 *  interactive parts are Client Components that fetch through the application
 *  service. */
export default function FeatureStorePage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground">Feature store</h1>
          <p className="max-w-prose text-muted-foreground">
            The canonical repository of every approved feature — manage lifecycle, versioning,
            metadata, lineage and discovery, and reuse features across research, backtesting, signal
            generation and production.
          </p>
        </div>
        <nav className="flex gap-2 text-sm" aria-label="Feature store sections">
          <Link
            href="/feature-store/families"
            className="rounded-md border px-3 py-1.5 hover:bg-accent"
          >
            Families
          </Link>
          <Link href="/features" className="rounded-md border px-3 py-1.5 hover:bg-accent">
            Feature registry
          </Link>
        </nav>
      </div>
      <FeatureStoreDashboard />
      <FeatureCatalog />
    </div>
  );
}
