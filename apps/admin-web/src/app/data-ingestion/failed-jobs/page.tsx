import type { Metadata } from 'next';
import { FailedJobs } from '@/modules/data-ingestion';

export const metadata: Metadata = { title: 'Failed jobs · Data Ingestion' };

/** Failed Jobs page. */
export default function FailedJobsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Failed jobs</h1>
      <FailedJobs />
    </div>
  );
}
