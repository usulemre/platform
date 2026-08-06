import type { ComponentType, ReactNode } from 'react';
import Link from 'next/link';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@platform/ui';
import type { Tone } from '../domain/view-model';

const TONE_VARIANT: Record<Tone, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  neutral: 'secondary',
  positive: 'default',
  warning: 'outline',
  danger: 'destructive',
  info: 'outline',
};

/** Presentational status/tone badge. Text label always present (not colour-only). */
export function StatusBadge({ label, tone }: { label: string; tone: Tone }) {
  return <Badge variant={TONE_VARIANT[tone]}>{label}</Badge>;
}

export function MonitorLoading({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-8 w-full" />
      ))}
    </div>
  );
}

export function MonitorEmpty({ label }: { label: string }) {
  return <p className="py-4 text-sm text-muted-foreground">{label}</p>;
}

export function MonitorError({ onRetry }: { onRetry?: () => void }) {
  return (
    <Alert variant="destructive" title="Unavailable">
      <div className="space-y-2">
        <p>This monitoring feed could not be reached (expected until the backend is available).</p>
        {onRetry ? (
          <Button size="sm" variant="outline" onClick={onRetry}>
            Retry
          </Button>
        ) : null}
      </div>
    </Alert>
  );
}

export interface QueryLike {
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly refetch: () => void;
}

export interface PanelItem {
  readonly id: string;
  readonly primary: ReactNode;
  readonly secondary?: ReactNode;
  readonly badge: { readonly label: string; readonly tone: Tone };
}

/**
 * Generic monitoring panel: a titled card that renders loading / error / empty /
 * list states from a query result. Presentation only.
 */
export function MonitorListPanel({
  title,
  icon: Icon,
  query,
  items,
  emptyLabel,
  href,
  hrefLabel = 'View all',
}: {
  title: string;
  icon: ComponentType<{ className?: string }>;
  query: QueryLike;
  items: readonly PanelItem[];
  emptyLabel: string;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {title}
        </CardTitle>
        {href ? (
          <Link href={href} className="text-xs text-muted-foreground hover:underline">
            {hrefLabel}
          </Link>
        ) : null}
      </CardHeader>
      <CardContent>
        {query.isLoading ? (
          <MonitorLoading />
        ) : query.isError ? (
          <MonitorError onRetry={query.refetch} />
        ) : items.length === 0 ? (
          <MonitorEmpty label={emptyLabel} />
        ) : (
          <ul className="space-y-1 text-sm">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 border-b py-1 last:border-0"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{item.primary}</span>
                  {item.secondary ? (
                    <span className="block truncate text-xs text-muted-foreground">
                      {item.secondary}
                    </span>
                  ) : null}
                </span>
                <StatusBadge label={item.badge.label} tone={item.badge.tone} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
