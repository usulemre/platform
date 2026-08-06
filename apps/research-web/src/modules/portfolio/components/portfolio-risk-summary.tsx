import { Card, CardContent, CardHeader, CardTitle } from '@platform/ui';
import { EmptyState } from '@platform/shell';
import { ShieldCheck } from 'lucide-react';
import { PortfolioStatusBadge } from './portfolio-status-badge';
import type { RiskIndicatorVm } from '../domain/view-model';

/**
 * Risk summary — the Risk Engine integration at the presentation layer. Risk
 * statuses are PRE-ASSESSED upstream against governed limits; this component only
 * displays them (no risk computation, no optimization).
 */
export function PortfolioRiskSummary({ risk }: { risk: readonly RiskIndicatorVm[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Risk summary</CardTitle>
      </CardHeader>
      <CardContent>
        {risk.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="Not assessed"
            description="Risk indicators will appear here."
          />
        ) : (
          <ul className="space-y-2">
            {risk.map((indicator) => (
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
                  <PortfolioStatusBadge label={indicator.statusLabel} tone={indicator.tone} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
