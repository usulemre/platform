import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@platform/ui';
import { StrategyStatusBadge } from './strategy-status-badge';
import type { StrategyListItemVm } from '../domain/view-model';

/** Accessible strategy catalog (card grid). Presentational only. */
export function StrategyCatalog({ strategies }: { strategies: readonly StrategyListItemVm[] }) {
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {strategies.map((strategy) => (
        <li key={strategy.id}>
          <Link
            href={`/strategies/${strategy.id}`}
            className="block h-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Card className="h-full transition-colors hover:bg-accent/40">
              <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
                <div>
                  <h3 className="font-medium">{strategy.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {strategy.category} · {strategy.assetClass} · v{strategy.version}
                  </p>
                </div>
                <StrategyStatusBadge label={strategy.status.label} tone={strategy.status.tone} />
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="line-clamp-2 text-sm text-muted-foreground">{strategy.description}</p>
                <div className="flex items-center justify-between">
                  <StrategyStatusBadge
                    label={strategy.eligibility.label}
                    tone={strategy.eligibility.tone}
                  />
                  <span className="text-xs text-muted-foreground">
                    Updated {strategy.updatedLabel}
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        </li>
      ))}
    </ul>
  );
}
