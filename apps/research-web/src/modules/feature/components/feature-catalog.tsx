import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@platform/ui';
import { FeatureStatusBadge } from './feature-status-badge';
import type { FeatureListItemVm } from '../domain/view-model';

/** Accessible feature catalog (card grid). Presentational only. */
export function FeatureCatalog({ features }: { features: readonly FeatureListItemVm[] }) {
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {features.map((feature) => (
        <li key={feature.id}>
          <Link
            href={`/features/${feature.id}`}
            className="block h-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Card className="h-full transition-colors hover:bg-accent/40">
              <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
                <div>
                  <h3 className="font-medium">{feature.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {feature.category} · {feature.assetClass} · v{feature.version}
                  </p>
                </div>
                <FeatureStatusBadge label={feature.status.label} tone={feature.status.tone} />
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="line-clamp-2 text-sm text-muted-foreground">{feature.description}</p>
                <div className="flex items-center justify-between">
                  <FeatureStatusBadge label={feature.approval.label} tone={feature.approval.tone} />
                  <span className="text-xs text-muted-foreground">
                    Updated {feature.updatedLabel}
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
