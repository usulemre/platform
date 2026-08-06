import type { ReactNode } from 'react';
import { Target } from 'lucide-react';
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

export function StatusBadge({ label, tone }: { label: string; tone: Tone }) {
  return <Badge variant={TONE_VARIANT[tone]}>{label}</Badge>;
}

export function OptLoading({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-10 w-full" />
      ))}
    </div>
  );
}

export function OptEmpty({ label }: { label: string }) {
  return <p className="py-4 text-sm text-muted-foreground">{label}</p>;
}

export function OptError({ onRetry }: { onRetry?: () => void }) {
  return (
    <Alert variant="destructive" title="Unable to load the portfolio optimization engine">
      <div className="space-y-2">
        <p>
          The portfolio optimization engine could not be reached. This is expected until the backend
          is available.
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

/** Engine note: this engine performs REAL, deterministic portfolio optimization. */
export function EngineNotice() {
  return (
    <div
      role="note"
      className="flex items-start gap-2 rounded-md border border-muted-foreground/30 bg-muted/40 px-3 py-2 text-sm text-muted-foreground"
    >
      <Target className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <p>
        The Portfolio Optimization Engine performs{' '}
        <span className="font-medium text-foreground">real</span>, deterministic optimization
        (minimum variance, mean-variance, maximum Sharpe, risk parity, …) over estimated returns and
        covariance, subject to real constraints. Every allocation is validated for constraint
        feasibility, determinism and a method-appropriate objective. It computes portfolio weights
        only — deploying capital, risk sign-off and execution belong to downstream engines.
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

/** A horizontal weight bar (0–100% of the max in a set). */
export function WeightBar({ fraction }: { fraction: number }) {
  const width = Math.max(0, Math.min(1, fraction)) * 100;
  return (
    <div className="h-2 w-full overflow-hidden rounded bg-muted">
      <div className="h-full rounded bg-primary" style={{ width: `${width}%` }} aria-hidden />
    </div>
  );
}

export const selectClass =
  'h-10 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
