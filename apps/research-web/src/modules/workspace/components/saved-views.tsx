'use client';

import Link from 'next/link';
import { Badge } from '@platform/ui';
import { useSavedViews } from '../hooks/use-workspace';
import { InfoCard, WsEmpty, WsError, WsLoading } from './workspace-atoms';

/** Saved Views — reusable, named filters that deep-link into module list pages. */
export function SavedViews() {
  const query = useSavedViews();
  return (
    <InfoCard title="Saved views">
      {query.isLoading ? (
        <WsLoading />
      ) : query.isError ? (
        <WsError onRetry={query.refetch} />
      ) : !query.data || query.data.length === 0 ? (
        <WsEmpty label="No saved views." />
      ) : (
        <ul className="space-y-3">
          {query.data.map((view) => (
            <li key={view.id} className="border-b pb-3 last:border-0 last:pb-0">
              <div className="flex items-center justify-between gap-3">
                <Link href={view.href} className="font-medium hover:underline">
                  {view.name}
                </Link>
                <Badge variant="secondary">{view.kindLabel}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{view.description}</p>
              <p className="text-xs text-muted-foreground">Filter: {view.filterLabel}</p>
            </li>
          ))}
        </ul>
      )}
    </InfoCard>
  );
}
