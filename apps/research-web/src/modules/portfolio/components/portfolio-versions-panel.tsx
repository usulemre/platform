import { History } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@platform/ui';
import { EmptyState } from '@platform/shell';
import type { PortfolioVersionVm } from '../domain/view-model';

/** Portfolio versioning panel (immutable, versioned snapshots — PS-4). */
export function PortfolioVersionsPanel({ versions }: { versions: readonly PortfolioVersionVm[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Snapshots</CardTitle>
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
                  {version.registeredLabel}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={History}
            title="No snapshots"
            description="Snapshot history will appear here."
          />
        )}
      </CardContent>
    </Card>
  );
}
