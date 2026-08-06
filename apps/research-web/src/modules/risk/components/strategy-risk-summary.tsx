import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@platform/ui';
import { EmptyState } from '@platform/shell';
import { Layers } from 'lucide-react';
import { RiskStatusBadge } from './risk-status-badge';
import type { StrategyRiskVm } from '../domain/view-model';

/**
 * Strategy risk summary — per-strategy risk levels for the assessed subject.
 * Levels are pre-assessed upstream; each strategy links to the Strategy Module.
 */
export function StrategyRiskSummary({ strategyRisk }: { strategyRisk: readonly StrategyRiskVm[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Strategy risk summary</CardTitle>
      </CardHeader>
      <CardContent>
        {strategyRisk.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="No strategies"
            description="No constituent strategies for this subject."
          />
        ) : (
          <ul className="space-y-2 text-sm">
            {strategyRisk.map((entry) => (
              <li
                key={entry.strategyId}
                className="flex items-center justify-between gap-4 border-b py-1"
              >
                <span className="min-w-0">
                  <Link href={entry.href} className="font-medium hover:underline">
                    {entry.name}
                  </Link>
                  <span className="block truncate text-xs text-muted-foreground">{entry.note}</span>
                </span>
                <RiskStatusBadge label={entry.levelLabel} tone={entry.tone} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
