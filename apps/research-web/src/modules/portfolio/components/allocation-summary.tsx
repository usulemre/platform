import { Card, CardContent, CardHeader, CardTitle } from '@platform/ui';
import { EmptyState } from '@platform/shell';
import { PieChart } from 'lucide-react';
import type { AllocationBucketVm } from '../domain/view-model';

/** Allocation summary — pre-supplied allocation breakdown (no computation). */
export function AllocationSummary({ allocations }: { allocations: readonly AllocationBucketVm[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Allocation summary</CardTitle>
      </CardHeader>
      <CardContent>
        {allocations.length === 0 ? (
          <EmptyState
            icon={PieChart}
            title="No allocation"
            description="Allocation breakdown will appear here."
          />
        ) : (
          <ul className="space-y-1 text-sm">
            {allocations.map((bucket) => (
              <li key={bucket.key} className="flex items-center justify-between border-b py-1">
                <span className="text-muted-foreground">{bucket.label}</span>
                <span className="font-medium">{bucket.weight}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
