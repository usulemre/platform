import { Card, CardContent, CardHeader, CardTitle } from '@platform/ui';
import { FeatureStatusBadge } from './feature-status-badge';
import type { ValidationVm } from '../domain/view-model';

/**
 * Feature validation summary — surfaces the Validation Foundation verdict and
 * the leakage-harness clearance (FA-2). Presentation only; the console never
 * asserts significance (AI-2).
 */
export function FeatureValidationSummary({ validation }: { validation: ValidationVm }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Validation</CardTitle>
        <FeatureStatusBadge label={validation.label} tone={validation.tone} />
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <FeatureStatusBadge
            label={validation.leakageHarnessLabel}
            tone={validation.leakageHarnessTone}
          />
        </div>
        <p className="text-muted-foreground">
          {validation.checkedLabel ? `Last checked ${validation.checkedLabel}` : 'Not yet checked'}{' '}
          · {validation.issueCount} issue{validation.issueCount === 1 ? '' : 's'}
        </p>
        {validation.issueCount > 0 ? (
          <ul className="space-y-1">
            {validation.issues.map((issue, index) => (
              <li key={`${issue.code}-${index}`} className="flex items-start gap-2">
                <FeatureStatusBadge label={issue.severity} tone={issue.tone} />
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
