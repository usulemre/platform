import { LineChart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@platform/ui';
import { EmptyState } from '@platform/shell';

/**
 * Performance placeholder. Deliberately NOT a metrics panel: no statistics or
 * backtest results are computed or shown here. Governed backtest attribution
 * arrives in a later phase; the backtest reference (if any) is shown for
 * traceability.
 */
export function PerformancePlaceholder({ backtestRef }: { backtestRef?: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <EmptyState
          icon={LineChart}
          title="Performance & attribution pending"
          description={
            backtestRef
              ? `Governed backtest reference: ${backtestRef}. Attribution will be shown after backtest governance.`
              : 'Performance and attribution will be available through governed backtesting in a later phase.'
          }
        />
      </CardContent>
    </Card>
  );
}
