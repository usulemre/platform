import type { ReactNode } from 'react';
import { Plug } from 'lucide-react';
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
import { cn } from '@platform/utils';
import type { MetadataRowVm, TimelineStepVm, Tone } from '../domain/view-model';

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

export function ConnectorLoading({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Loading connectors">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-10 w-full" />
      ))}
    </div>
  );
}

export function ConnectorEmpty({ label }: { label: string }) {
  return <p className="py-4 text-sm text-muted-foreground">{label}</p>;
}

export function ConnectorError({ onRetry }: { onRetry?: () => void }) {
  return (
    <Alert variant="destructive" title="Unable to load connectors">
      <div className="space-y-2">
        <p>
          The connector registry could not be reached. This is expected until the backend is
          available.
        </p>
        {onRetry ? (
          <Button size="sm" variant="outline" onClick={onRetry}>
            Retry
          </Button>
        ) : null}
      </div>
    </Alert>
  );
}

/** Platform note: connectors are governed abstractions; this console never talks
 *  to external APIs and holds no secrets. */
export function PlatformNotice() {
  return (
    <div
      role="note"
      className="flex items-start gap-2 rounded-md border border-muted-foreground/30 bg-muted/40 px-3 py-2 text-sm text-muted-foreground"
    >
      <Plug className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <p>
        This console manages{' '}
        <span className="font-medium text-foreground">connector abstractions</span> and their
        governed metadata. It never communicates with external providers and holds no secrets —
        credentials are brokered by reference, and real connections run in infrastructure.
      </p>
    </div>
  );
}

/** Titled card wrapper. */
export function InfoCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

/** Definition-list of pre-mapped rows. */
export function KeyValueList({ rows }: { rows: readonly MetadataRowVm[] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
      {rows.map((row) => (
        <div key={row.label} className="flex justify-between gap-4 border-b py-1 text-sm">
          <dt className="text-muted-foreground">{row.label}</dt>
          <dd className="font-medium">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

const DOT: Record<TimelineStepVm['state'], string> = {
  done: 'bg-primary border-primary',
  current: 'bg-background border-primary ring-2 ring-primary/30',
  pending: 'bg-background border-muted-foreground/40',
};

/** Lifecycle timeline renderer. */
export function Timeline({ steps }: { steps: readonly TimelineStepVm[] }) {
  return (
    <ol className="space-y-3">
      {steps.map((step) => (
        <li key={step.stage} className="flex items-start gap-3">
          <span
            aria-hidden
            className={cn('mt-1 h-3 w-3 shrink-0 rounded-full border', DOT[step.state])}
          />
          <div className="flex flex-1 items-center justify-between gap-2 text-sm">
            <span
              className={cn('font-medium', step.state === 'pending' && 'text-muted-foreground')}
            >
              {step.label}
            </span>
            <span className="text-xs text-muted-foreground">
              {step.dateLabel ?? (step.state === 'current' ? 'In progress' : 'Pending')}
            </span>
          </div>
        </li>
      ))}
    </ol>
  );
}
