import { History } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@platform/ui';
import { EmptyState } from '@platform/shell';
import type { FeatureVersionVm } from '../domain/view-model';

/** Feature versioning panel (immutable, versioned releases — FA-4). */
export function FeatureVersionsPanel({ versions }: { versions: readonly FeatureVersionVm[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Versions</CardTitle>
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
            title="No versions"
            description="Version history will appear here."
          />
        )}
      </CardContent>
    </Card>
  );
}
