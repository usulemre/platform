'use client';

import { usePreferences } from '../hooks/use-workspace';
import { InfoCard, WsEmpty, WsError, WsLoading } from './workspace-atoms';

/** Workspace Preferences — read-only presentation of the researcher's workspace
 *  settings. Editing/persistence is out of scope for v1 (no persistence). */
export function WorkspacePreferences() {
  const query = usePreferences();
  return (
    <InfoCard title="Workspace preferences">
      {query.isLoading ? (
        <WsLoading />
      ) : query.isError ? (
        <WsError onRetry={query.refetch} />
      ) : !query.data || query.data.length === 0 ? (
        <WsEmpty label="No preferences configured." />
      ) : (
        <dl className="divide-y text-sm">
          {query.data.map((row) => (
            <div key={row.label} className="flex justify-between gap-3 py-1.5">
              <dt className="text-muted-foreground">{row.label}</dt>
              <dd className="font-medium">{row.value}</dd>
            </div>
          ))}
        </dl>
      )}
      <p role="note" className="mt-3 text-xs text-muted-foreground">
        Editing preferences will be available when the workspace backend is connected.
      </p>
    </InfoCard>
  );
}
