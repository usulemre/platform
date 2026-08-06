import { GitBranch } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@platform/ui';
import { EmptyState } from '@platform/shell';
import type { LineageNodeVm } from '../domain/view-model';

/** Feature lineage — provenance chain from sources to this feature (DP-1). */
export function FeatureLineagePanel({ lineage }: { lineage: readonly LineageNodeVm[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lineage</CardTitle>
      </CardHeader>
      <CardContent>
        {lineage.length > 0 ? (
          <ol className="space-y-1 text-sm">
            {lineage.map((node) => (
              <li key={node.id} className="flex items-center justify-between border-b py-1">
                <span className="font-medium">{node.label}</span>
                <span className="text-xs uppercase text-muted-foreground">{node.kind}</span>
              </li>
            ))}
          </ol>
        ) : (
          <EmptyState
            icon={GitBranch}
            title="No lineage recorded"
            description="Provenance lineage will appear here."
          />
        )}
      </CardContent>
    </Card>
  );
}
