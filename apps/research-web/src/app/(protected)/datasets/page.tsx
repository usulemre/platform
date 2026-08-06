import type { Metadata } from 'next';
import { DatasetsView } from '@/modules/dataset';

export const metadata: Metadata = {
  title: 'Datasets · Research Platform',
};

/** Dataset List page (Server Component). The interactive list is a Client
 *  Component that fetches through the application service. */
export default function DatasetsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Datasets</h1>
      <p className="max-w-prose text-muted-foreground">
        Registered, governed datasets. Read-only presentation — ingestion and certification occur
        through governed workflows, never from this console.
      </p>
      <DatasetsView />
    </div>
  );
}
