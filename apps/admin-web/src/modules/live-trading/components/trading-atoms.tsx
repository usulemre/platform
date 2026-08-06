import type { ReactNode } from 'react';
import { Rocket } from 'lucide-react';
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
import type { MetadataRowVm, ProgressVm, Tone } from '../domain/view-model';

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

export function TradingLoading({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-10 w-full" />
      ))}
    </div>
  );
}

export function TradingEmpty({ label }: { label: string }) {
  return <p className="py-4 text-sm text-muted-foreground">{label}</p>;
}

export function TradingError({ onRetry }: { onRetry?: () => void }) {
  return (
    <Alert variant="destructive" title="Unable to load the live trading platform">
      <div className="space-y-2">
        <p>
          The live trading platform could not be reached. This is expected until the backend is
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

/** Governance note: the platform orchestrates governed production trading through broker
 *  ABSTRACTIONS; it never contacts an exchange or broker, holds no API keys, and never
 *  decides. Default posture is paper/shadow; live requires a valid authorization token;
 *  the kill switch is always available to authorized humans. */
export function GovernanceNotice() {
  return (
    <div
      role="note"
      className="flex items-start gap-2 rounded-md border border-muted-foreground/30 bg-muted/40 px-3 py-2 text-sm text-muted-foreground"
    >
      <Rocket className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <p>
        The Live Trading Platform <span className="font-medium text-foreground">orchestrates</span>{' '}
        governed production trading through broker{' '}
        <span className="font-medium text-foreground">abstractions</span>; it never contacts an
        exchange or broker, holds no API keys, and never decides. Default posture is paper/shadow,
        live requires a valid authorization token, and the kill switch is always available to
        authorized humans — reflected here, never executed here.
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

export function TagList({ tags }: { tags: readonly string[] }) {
  if (tags.length === 0) return <span className="text-sm text-muted-foreground">No tags.</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((tag) => (
        <Badge key={tag} variant="secondary">
          {tag}
        </Badge>
      ))}
    </div>
  );
}

/** Accessible progress bar (lifecycle completion). */
export function ProgressBar({ progress, ariaLabel }: { progress: ProgressVm; ariaLabel?: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{progress.currentStageLabel}</span>
        <span>{progress.label}</span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={progress.percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={ariaLabel ?? 'Progress'}
      >
        <div
          className={cn('h-full rounded-full bg-primary')}
          style={{ width: `${progress.percent}%` }}
        />
      </div>
    </div>
  );
}
