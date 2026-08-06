import type { ReactNode } from 'react';
import { Gauge } from 'lucide-react';
import { Alert, Badge, Card, CardContent, CardHeader, CardTitle, Skeleton } from '@platform/ui';
import type { Tone } from '../domain/format';
import type { Chip, KpiVm } from '../domain/view-model';

const TONE_VARIANT: Record<Tone, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  neutral: 'secondary',
  positive: 'default',
  warning: 'outline',
  danger: 'destructive',
  info: 'outline',
};

const TONE_TEXT: Record<Tone, string> = {
  neutral: 'text-foreground',
  positive: 'text-emerald-600',
  warning: 'text-amber-600',
  danger: 'text-red-600',
  info: 'text-sky-600',
};

export function StatusBadge({ label, tone }: { label: string; tone: Tone }) {
  return <Badge variant={TONE_VARIANT[tone]}>{label}</Badge>;
}

export function ChipBadge({ chip }: { chip: Chip }) {
  return <StatusBadge label={chip.label} tone={chip.tone} />;
}

export function ToneText({ value, tone }: { value: string; tone: Tone }) {
  return <span className={`font-mono ${TONE_TEXT[tone]}`}>{value}</span>;
}

export function TcaLoading({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-10 w-full" />
      ))}
    </div>
  );
}

export function TcaEmpty({ label }: { label: string }) {
  return <p className="py-6 text-sm text-muted-foreground">{label}</p>;
}

export function TcaError({ onRetry }: { onRetry?: () => void }) {
  return (
    <Alert variant="destructive" title="Unable to load transaction cost analysis">
      <div className="space-y-2">
        <p>The TCA engine could not be reached. This is expected until the backend is available.</p>
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

/** Engine note: TCA measures execution quality post-trade; it is broker-independent. */
export function EngineNotice() {
  return (
    <div
      role="note"
      className="flex items-start gap-2 rounded-md border border-muted-foreground/30 bg-muted/40 px-3 py-2 text-sm text-muted-foreground"
    >
      <Gauge className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <p>
        The Transaction Cost Analysis engine evaluates execution quality by comparing executed
        trades against market <span className="font-medium text-foreground">benchmarks</span> and
        execution objectives. Every slippage, spread, market-impact, implementation-shortfall and
        quality figure is a <span className="font-medium text-foreground">real, deterministic</span>{' '}
        post-trade calculation. It is{' '}
        <span className="font-medium text-foreground">broker-independent</span> — no exchange,
        broker or FIX connectivity; analysis never contacts a venue.
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

export function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: Tone;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium uppercase text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className={`text-2xl font-semibold ${tone ? TONE_TEXT[tone] : ''}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

export function KpiGrid({ kpis }: { kpis: readonly KpiVm[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {kpis.map((kpi) => (
        <StatCard key={kpi.label} label={kpi.label} value={kpi.value} tone={kpi.tone} />
      ))}
    </div>
  );
}

/** A horizontal share bar (0–100) for attribution / distribution. */
export function ShareBar({ pct, tone = 'info' }: { pct: number; tone?: Tone }) {
  const color =
    tone === 'danger'
      ? 'bg-red-500'
      : tone === 'warning'
        ? 'bg-amber-500'
        : tone === 'positive'
          ? 'bg-emerald-500'
          : 'bg-sky-500';
  return (
    <div className="h-2 w-full overflow-hidden rounded bg-muted">
      <div className={`h-full ${color}`} style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
    </div>
  );
}

export const selectClass =
  'h-9 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
