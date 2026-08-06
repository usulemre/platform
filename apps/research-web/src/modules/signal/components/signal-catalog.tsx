import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@platform/ui';
import { SignalStatusBadge } from './signal-status-badge';
import type { SignalListItemVm } from '../domain/view-model';

/** Accessible signal catalog (card grid). Presentational only. */
export function SignalCatalog({ signals }: { signals: readonly SignalListItemVm[] }) {
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {signals.map((signal) => (
        <li key={signal.id}>
          <Link
            href={`/signals/${signal.id}`}
            className="block h-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Card className="h-full transition-colors hover:bg-accent/40">
              <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
                <div>
                  <h3 className="font-medium">{signal.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {signal.category} · {signal.assetClass} · v{signal.version}
                  </p>
                </div>
                <SignalStatusBadge label={signal.status.label} tone={signal.status.tone} />
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="line-clamp-2 text-sm text-muted-foreground">{signal.description}</p>
                <div className="flex items-center justify-between">
                  <SignalStatusBadge
                    label={signal.eligibility.label}
                    tone={signal.eligibility.tone}
                  />
                  <span className="text-xs text-muted-foreground">
                    Updated {signal.updatedLabel}
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
