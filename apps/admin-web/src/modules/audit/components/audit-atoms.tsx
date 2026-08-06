import type { ReactNode } from 'react';
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
import type { MetadataRowVm, PageInfoVm, Tone } from '../domain/view-model';

const TONE_VARIANT: Record<Tone, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  neutral: 'secondary',
  positive: 'default',
  warning: 'outline',
  danger: 'destructive',
  info: 'outline',
};

/** Presentational outcome/tone badge. Text label always present (not colour-only). */
export function OutcomeBadge({ label, tone }: { label: string; tone: Tone }) {
  return <Badge variant={TONE_VARIANT[tone]}>{label}</Badge>;
}

export function CategoryBadge({ label }: { label: string }) {
  return <Badge variant="secondary">{label}</Badge>;
}

export function AuditLoading({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Loading audit events">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-10 w-full" />
      ))}
    </div>
  );
}

export function AuditEmpty({ label }: { label: string }) {
  return <p className="py-4 text-sm text-muted-foreground">{label}</p>;
}

export function AuditError({ onRetry }: { onRetry?: () => void }) {
  return (
    <Alert variant="destructive" title="Unable to load audit events">
      <div className="space-y-2">
        <p>
          The audit service could not be reached. This is expected until the backend is available.
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

export function KeyValueList({
  rows,
  mono = false,
}: {
  rows: readonly MetadataRowVm[];
  mono?: boolean;
}) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
      {rows.map((row) => (
        <div key={row.label} className="flex justify-between gap-4 border-b py-1 text-sm">
          <dt className="text-muted-foreground">{row.label}</dt>
          <dd className={mono ? 'font-mono text-xs' : 'font-medium'}>{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Pagination({
  info,
  onPrev,
  onNext,
}: {
  info: PageInfoVm;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <nav className="flex items-center justify-between gap-4 text-sm" aria-label="Pagination">
      <span className="text-muted-foreground">
        Page {info.page} of {info.totalPages} · {info.total} event{info.total === 1 ? '' : 's'}
      </span>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={onPrev} disabled={!info.hasPrev}>
          Previous
        </Button>
        <Button size="sm" variant="outline" onClick={onNext} disabled={!info.hasNext}>
          Next
        </Button>
      </div>
    </nav>
  );
}
