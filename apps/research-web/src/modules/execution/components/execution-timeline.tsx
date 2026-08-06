import { Card, CardContent, CardHeader, CardTitle } from '@platform/ui';
import { cn } from '@platform/utils';
import type { TimelineStepVm } from '../domain/view-model';

const DOT: Record<TimelineStepVm['state'], string> = {
  done: 'bg-primary border-primary',
  current: 'bg-background border-primary ring-2 ring-primary/30',
  pending: 'bg-background border-muted-foreground/40',
};

/** Execution lifecycle timeline (request → approval → authorization → run). */
export function ExecutionTimeline({ steps }: { steps: readonly TimelineStepVm[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Execution timeline</CardTitle>
      </CardHeader>
      <CardContent>
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
                  {step.actor ? (
                    <span className="ml-1 text-xs text-muted-foreground">· {step.actor}</span>
                  ) : null}
                </span>
                <span className="text-xs text-muted-foreground">
                  {step.dateLabel ?? (step.state === 'current' ? 'In progress' : 'Pending')}
                </span>
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
