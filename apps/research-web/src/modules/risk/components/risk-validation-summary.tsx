import { Card, CardContent, CardHeader, CardTitle } from '@platform/ui';
import { RiskStatusBadge } from './risk-status-badge';
import type { ValidationVm } from '../domain/view-model';

/**
 * Validation summary — surfaces the Validation Foundation verdict for the
 * assessment. Presentation only; the console never asserts significance (AI-2).
 */
export function RiskValidationSummary({ validation }: { validation: ValidationVm }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Validation</CardTitle>
        <RiskStatusBadge label={validation.label} tone={validation.tone} />
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p className="text-muted-foreground">
          {validation.checkedLabel ? `Last checked ${validation.checkedLabel}` : 'Not yet checked'}{' '}
          · {validation.issueCount} issue{validation.issueCount === 1 ? '' : 's'}
        </p>
        {validation.issueCount > 0 ? (
          <ul className="space-y-1">
            {validation.issues.map((issue, index) => (
              <li key={`${issue.code}-${index}`} className="flex items-start gap-2">
                <RiskStatusBadge label={issue.severity} tone={issue.tone} />
                <span>
                  <span className="font-mono text-xs text-muted-foreground">{issue.code}</span>{' '}
                  {issue.message}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">No issues reported.</p>
        )}
      </CardContent>
    </Card>
  );
}
