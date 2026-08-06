import { Card, CardContent, CardHeader, CardTitle } from '@platform/ui';
import { EmptyState } from '@platform/shell';
import { Ruler } from 'lucide-react';
import { PortfolioStatusBadge } from './portfolio-status-badge';
import type { ConstraintVm } from '../domain/view-model';

/**
 * Constraint summary — the Portfolio Construction Rulebook integration at the
 * presentation layer. Constraint statuses are PRE-ASSESSED upstream against
 * governed limits; this component only displays them (no computation).
 */
export function ConstraintSummary({ constraints }: { constraints: readonly ConstraintVm[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Constraints</CardTitle>
      </CardHeader>
      <CardContent>
        {constraints.length === 0 ? (
          <EmptyState
            icon={Ruler}
            title="No constraints"
            description="Construction constraints will appear here."
          />
        ) : (
          <ul className="space-y-2">
            {constraints.map((constraint) => (
              <li
                key={constraint.key}
                className="flex items-center justify-between gap-4 border-b py-1 text-sm"
              >
                <span className="text-muted-foreground">
                  {constraint.label} <span className="text-xs">(limit {constraint.limit})</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="font-medium">{constraint.value}</span>
                  <PortfolioStatusBadge label={constraint.statusLabel} tone={constraint.tone} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
