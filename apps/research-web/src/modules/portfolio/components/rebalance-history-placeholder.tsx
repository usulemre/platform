import { RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@platform/ui';
import { EmptyState } from '@platform/shell';

/**
 * Rebalance history placeholder. Deliberately not implemented: rebalance events
 * are governed, immutable snapshots produced elsewhere. Shown as a placeholder
 * until the governed rebalance history is available.
 */
export function RebalanceHistoryPlaceholder() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Rebalance history</CardTitle>
      </CardHeader>
      <CardContent>
        <EmptyState
          icon={RefreshCw}
          title="Rebalance history pending"
          description="Governed rebalance snapshots will be listed here in a later phase."
        />
      </CardContent>
    </Card>
  );
}
