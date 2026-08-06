'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
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
import { useCommandStore } from '@platform/shell';
import type { Tone, WorkspaceItemVm } from '../domain/view-model';

const TONE_VARIANT: Record<Tone, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  neutral: 'secondary',
  positive: 'default',
  warning: 'outline',
  danger: 'destructive',
  info: 'outline',
};

export function StatusBadge({ label, tone }: { label: string; tone: Tone }) {
  return <Badge variant={TONE_VARIANT[tone]}>{label}</Badge>;
}

export function KindBadge({ label }: { label: string }) {
  return <Badge variant="secondary">{label}</Badge>;
}

export function WsLoading({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-8 w-full" />
      ))}
    </div>
  );
}

export function WsEmpty({ label }: { label: string }) {
  return <p className="py-2 text-sm text-muted-foreground">{label}</p>;
}

export function WsError({ onRetry }: { onRetry?: () => void }) {
  return (
    <Alert variant="destructive" title="Unavailable">
      <div className="space-y-2">
        <p>This workspace panel could not be loaded (expected until the backend is available).</p>
        {onRetry ? (
          <Button size="sm" variant="outline" onClick={onRetry}>
            Retry
          </Button>
        ) : null}
      </div>
    </Alert>
  );
}

export function InfoCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        {action}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export interface ItemQueryLike {
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly data?: readonly WorkspaceItemVm[];
  readonly refetch: () => void;
}

/** Generic list of workspace items (links + status), driven by a query result. */
export function ItemList({ query, emptyLabel }: { query: ItemQueryLike; emptyLabel: string }) {
  if (query.isLoading) return <WsLoading />;
  if (query.isError) return <WsError onRetry={query.refetch} />;
  if (!query.data || query.data.length === 0) return <WsEmpty label={emptyLabel} />;
  return (
    <ul className="space-y-1 text-sm">
      {query.data.map((item) => (
        <li
          key={`${item.kind}-${item.id}`}
          className="flex items-center justify-between gap-3 border-b py-1 last:border-0"
        >
          <span className="flex min-w-0 items-center gap-2">
            <KindBadge label={item.kindLabel} />
            <Link href={item.href} className="truncate font-medium hover:underline">
              {item.name}
            </Link>
          </span>
          <span className="flex shrink-0 items-center gap-2">
            <StatusBadge label={item.status.label} tone={item.status.tone} />
            <span className="text-xs text-muted-foreground">{item.updatedLabel}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Global Search integration — opens the shell command palette (Cmd/Ctrl+K). */
export function GlobalSearchButton() {
  const open = useCommandStore((state) => state.open);
  return (
    <button
      type="button"
      onClick={open}
      aria-label="Open global search"
      className="flex w-full max-w-md items-center gap-2 rounded-md border px-3 py-2 text-sm text-muted-foreground hover:bg-accent"
    >
      <Search className="h-4 w-4" />
      <span>Search across the platform…</span>
      <kbd className="ml-auto rounded bg-muted px-1 text-xs">⌘K</kbd>
    </button>
  );
}
