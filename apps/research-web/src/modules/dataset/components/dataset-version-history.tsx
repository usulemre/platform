import { History } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@platform/ui';
import { EmptyState } from '@platform/shell';
import type { DatasetVersionVm } from '../domain/view-model';

/** Dataset version history (placeholder). Lists known vintages if present. */
export function DatasetVersionHistory({ versions }: { versions: readonly DatasetVersionVm[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Version history</CardTitle>
      </CardHeader>
      <CardContent>
        {versions.length > 0 ? (
          <ul className="space-y-1 text-sm">
            {versions.map((version) => (
              <li
                key={version.version}
                className="flex items-center justify-between gap-4 border-b py-1"
              >
                <span className="font-medium">{version.version}</span>
                <span className="truncate text-muted-foreground">{version.note}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {version.knowledgeTimeLabel}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={History}
            title="No version history"
            description="Dataset vintages will be listed here in a later phase."
          />
        )}
      </CardContent>
    </Card>
  );
}
