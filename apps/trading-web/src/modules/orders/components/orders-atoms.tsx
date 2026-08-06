import type { ReactNode } from 'react';
import { ListOrdered } from 'lucide-react';
import { Alert, Badge, Card, CardContent, CardHeader, CardTitle, Skeleton } from '@platform/ui';
import type { Tone } from '../domain/view-model';

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

export function OrdLoading({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-10 w-full" />
      ))}
    </div>
  );
}

export function OrdEmpty({ label }: { label: string }) {
  return <p className="py-6 text-sm text-muted-foreground">{label}</p>;
}

export function OrdError({ onRetry }: { onRetry?: () => void }) {
  return (
    <Alert variant="destructive" title="Unable to load the order management system">
      <div className="space-y-2">
        <p>The OMS could not be reached. This is expected until the backend is available.</p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-md border px-3 py-1 text-sm hover:bg-accent"
          >
            Retry
          </button>
        ) : null}
      </div>
    </Alert>
  );
}

/** Engine note: the OMS is the single source of truth for orders before routing to execution. */
export function EngineNotice() {
  return (
    <div
      role="note"
      className="flex items-start gap-2 rounded-md border border-muted-foreground/30 bg-muted/40 px-3 py-2 text-sm text-muted-foreground"
    >
      <ListOrdered className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <p>
        The Order Management System is the{' '}
        <span className="font-medium text-foreground">single source of truth</span> for all orders
        before they are routed to an execution venue. It manages the full order lifecycle (created →
        validated → pending approval → approved → queued → submitted → accepted → partially filled →
        filled / cancelled / rejected / expired) with a real state machine. It contains no broker,
        exchange or FIX connectivity — routing to a venue happens downstream.
      </p>
    </div>
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

export function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium uppercase text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

export const selectClass =
  'h-10 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
