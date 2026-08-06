import { Card, CardContent, CardHeader, CardTitle } from '@platform/ui';
import { EmptyState } from '@platform/shell';
import { Gauge } from 'lucide-react';
import { SignalStatusBadge } from './signal-status-badge';
import type { QualityIndicatorVm } from '../domain/view-model';

/**
 * Signal quality indicators. Ratings are PRE-ASSESSED upstream; this component
 * only displays them (no statistical assessment happens here).
 */
export function SignalQualityIndicators({ quality }: { quality: readonly QualityIndicatorVm[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quality indicators</CardTitle>
      </CardHeader>
      <CardContent>
        {quality.length === 0 ? (
          <EmptyState
            icon={Gauge}
            title="Not assessed"
            description="Quality indicators will appear here."
          />
        ) : (
          <ul className="space-y-2">
            {quality.map((indicator) => (
              <li
                key={indicator.key}
                className="flex items-center justify-between gap-4 border-b py-1 text-sm"
              >
                <span className="text-muted-foreground">{indicator.label}</span>
                <span className="flex items-center gap-2">
                  <span className="font-medium">{indicator.value}</span>
                  <SignalStatusBadge label={indicator.ratingLabel} tone={indicator.tone} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
