import { Card, CardContent, CardHeader, CardTitle } from '@platform/ui';
import { EmptyState } from '@platform/shell';
import { Gauge } from 'lucide-react';
import { RiskStatusBadge } from './risk-status-badge';
import type { IndicatorVm } from '../domain/view-model';

/**
 * Shared indicator list used by the Portfolio Risk Summary, Exposure Overview and
 * Constraint Compliance views. Values/limits/statuses are pre-supplied; nothing
 * is computed here.
 */
export function IndicatorList({
  title,
  indicators,
  emptyLabel,
}: {
  title: string;
  indicators: readonly IndicatorVm[];
  emptyLabel: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {indicators.length === 0 ? (
          <EmptyState icon={Gauge} title="Not assessed" description={emptyLabel} />
        ) : (
          <ul className="space-y-2">
            {indicators.map((indicator) => (
              <li
                key={indicator.key}
                className="flex items-center justify-between gap-4 border-b py-1 text-sm"
              >
                <span className="text-muted-foreground">
                  {indicator.label}
                  {indicator.limit ? (
                    <span className="ml-1 text-xs">(limit {indicator.limit})</span>
                  ) : null}
                </span>
                <span className="flex items-center gap-2">
                  <span className="font-medium">{indicator.value}</span>
                  <RiskStatusBadge label={indicator.statusLabel} tone={indicator.tone} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
