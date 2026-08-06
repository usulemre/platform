import { GitBranch } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@platform/ui';
import { EmptyState } from '@platform/shell';
import type { DatasetLineageNodeVm } from '../domain/view-model';

/** Dataset lineage panel (placeholder). Shows known lineage nodes if present;
 *  the full provenance graph arrives in a later phase. */
export function DatasetLineagePanel({
  lineage,
  lineageRef,
}: {
  lineage: readonly DatasetLineageNodeVm[];
  lineageRef?: string;
}) {
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
            title="Lineage view coming soon"
            description={
              lineageRef
                ? `Provenance graph reference: ${lineageRef}`
                : 'The full provenance graph will be available in a later phase.'
            }
          />
        )}
      </CardContent>
    </Card>
  );
}
