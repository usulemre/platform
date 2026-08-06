import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@platform/ui';
import { PortfolioStatusBadge } from './portfolio-status-badge';
import type { PortfolioListItemVm } from '../domain/view-model';

/** Accessible portfolio catalog (card grid). Presentational only. */
export function PortfolioCatalog({ portfolios }: { portfolios: readonly PortfolioListItemVm[] }) {
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {portfolios.map((portfolio) => (
        <li key={portfolio.id}>
          <Link
            href={`/portfolios/${portfolio.id}`}
            className="block h-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Card className="h-full transition-colors hover:bg-accent/40">
              <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
                <div>
                  <h3 className="font-medium">{portfolio.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {portfolio.mandate} · {portfolio.assetClass} · v{portfolio.version}
                  </p>
                </div>
                <PortfolioStatusBadge label={portfolio.status.label} tone={portfolio.status.tone} />
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {portfolio.description}
                </p>
                <div className="flex items-center justify-between">
                  <PortfolioStatusBadge
                    label={portfolio.deployment.label}
                    tone={portfolio.deployment.tone}
                  />
                  <span className="text-xs text-muted-foreground">
                    Updated {portfolio.updatedLabel}
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
