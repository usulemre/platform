import type { Metadata } from 'next';
import { RetryQueue } from '@/modules/data-ingestion';

export const metadata: Metadata = { title: 'Retry queue · Data Ingestion' };

/** Retry Queue + Dead-letter queue page. */
export default function RetryQueuePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Retry queue</h1>
      <RetryQueue />
    </div>
  );
}
