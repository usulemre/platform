import { Card, CardContent, CardHeader, CardTitle } from '@platform/ui';
import { DatasetStatusBadge } from './dataset-status-badge';
import type { ValidationVm } from '../domain/view-model';

/**
 * Dataset validation summary — surfaces the Validation Foundation verdict for a
 * dataset (status + issues). Presentation only; the verdict is produced upstream.
 */
export function DatasetValidationSummary({ validation }: { validation: ValidationVm }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Validation</CardTitle>
        <DatasetStatusBadge label={validation.label} tone={validation.tone} />
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
                <DatasetStatusBadge label={issue.severity} tone={issue.tone} />
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
