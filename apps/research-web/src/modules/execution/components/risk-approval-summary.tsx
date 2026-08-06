import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@platform/ui';
import { ExecutionStatusBadge } from './execution-status-badge';
import type { RiskApprovalVm } from '../domain/view-model';

/**
 * Risk approval summary — the Risk Module integration. Shows the governing risk
 * verdict and level and links to the full risk assessment. Read-only.
 */
export function RiskApprovalSummary({ riskApproval }: { riskApproval: RiskApprovalVm }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Risk approval</CardTitle>
        <ExecutionStatusBadge label={riskApproval.verdict.label} tone={riskApproval.verdict.tone} />
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p>
          <Link href={riskApproval.href} className="font-medium hover:underline">
            {riskApproval.assessmentTitle}
          </Link>
        </p>
        <p className="flex items-center gap-2">
          <ExecutionStatusBadge
            label={riskApproval.riskLevel.label}
            tone={riskApproval.riskLevel.tone}
          />
          {riskApproval.decidedLabel ? (
            <span className="text-xs text-muted-foreground">
              Decided {riskApproval.decidedLabel}
            </span>
          ) : null}
        </p>
      </CardContent>
    </Card>
  );
}
