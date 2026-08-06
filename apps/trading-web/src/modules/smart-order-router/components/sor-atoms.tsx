import type { ReactNode } from 'react';
import { Network } from 'lucide-react';
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

export function SorLoading({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-10 w-full" />
      ))}
    </div>
  );
}

export function SorEmpty({ label }: { label: string }) {
  return <p className="py-6 text-sm text-muted-foreground">{label}</p>;
}

export function SorError({ onRetry }: { onRetry?: () => void }) {
  return (
    <Alert variant="destructive" title="Unable to load the smart order router">
      <div className="space-y-2">
        <p>
          The Smart Order Router could not be reached. This is expected until the backend is
          available.
        </p>
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

/** Engine note: the SOR selects the venue and routes; it is broker-independent. */
export function EngineNotice() {
  return (
    <div
      role="note"
      className="flex items-start gap-2 rounded-md border border-muted-foreground/30 bg-muted/40 px-3 py-2 text-sm text-muted-foreground"
    >
      <Network className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <p>
        The Smart Order Router receives routing requests from the Execution Engine and determines
        the <span className="font-medium text-foreground">optimal venue</span> under configurable
        routing policies. It discovers, filters, evaluates, ranks, selects, validates and confirms a
        route with a real state machine, policy framework and venue ranking. It is{' '}
        <span className="font-medium text-foreground">broker-independent</span> — no exchange,
        broker or FIX connectivity; the confirmed route is handed back to the Execution Engine.
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
