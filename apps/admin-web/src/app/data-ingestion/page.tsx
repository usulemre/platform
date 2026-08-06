import type { Metadata } from 'next';
import Link from 'next/link';
import { IngestionDashboard, PipelineRegistry } from '@/modules/data-ingestion';

export const metadata: Metadata = {
  title: 'Data Ingestion · Admin',
};

/** Data Ingestion Pipeline — Dashboard + Pipeline Registry (Server Component).
 *  The interactive parts are Client Components that fetch through the application
 *  service. */
export default function DataIngestionPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground">Data Ingestion</h1>
          <p className="max-w-prose text-muted-foreground">
            The single entry point for all external data. Pipelines receive raw data only through
            connector abstractions and transform it into canonical internal datasets.
          </p>
        </div>
        <nav className="flex gap-2 text-sm" aria-label="Ingestion sections">
          <Link
            href="/data-ingestion/failed-jobs"
            className="rounded-md border px-3 py-1.5 hover:bg-accent"
          >
            Failed jobs
          </Link>
          <Link
            href="/data-ingestion/retry-queue"
            className="rounded-md border px-3 py-1.5 hover:bg-accent"
          >
            Retry queue
          </Link>
        </nav>
      </div>
      <IngestionDashboard />
      <PipelineRegistry />
    </div>
  );
}
