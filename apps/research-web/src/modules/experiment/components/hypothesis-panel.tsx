import { Lock } from 'lucide-react';
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@platform/ui';
import type { HypothesisVm } from '../domain/view-model';

/**
 * Hypothesis panel — surfaces the pre-registered, falsifiable hypothesis and its
 * frozen success criteria (SM-2). Presentation only; freezing is enforced upstream.
 */
export function HypothesisPanel({ hypothesis }: { hypothesis: HypothesisVm }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Hypothesis</CardTitle>
        {hypothesis.frozen ? (
          <Badge variant="outline" className="gap-1">
            <Lock className="h-3 w-3" aria-hidden />
            Frozen
          </Badge>
        ) : (
          <Badge variant="secondary">Draft</Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p>{hypothesis.statement}</p>
        <div>
          <h3 className="text-xs font-semibold uppercase text-muted-foreground">
            Falsifiable prediction
          </h3>
          <p className="text-muted-foreground">{hypothesis.prediction}</p>
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase text-muted-foreground">
            Success criteria
          </h3>
          <p className="text-muted-foreground">{hypothesis.successCriteria}</p>
        </div>
        <p className="text-xs text-muted-foreground">{hypothesis.preRegisteredLabel}</p>
      </CardContent>
    </Card>
  );
}
