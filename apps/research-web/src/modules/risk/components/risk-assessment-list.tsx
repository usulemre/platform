import Link from 'next/link';
import { RiskStatusBadge } from './risk-status-badge';
import type { RiskListItemVm } from '../domain/view-model';

/** Accessible risk assessment list table. Presentational only. */
export function RiskAssessmentList({ assessments }: { assessments: readonly RiskListItemVm[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Risk assessments</caption>
        <thead className="border-b bg-muted/50 text-xs uppercase text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-2">
              Assessment
            </th>
            <th scope="col" className="px-4 py-2">
              Subject
            </th>
            <th scope="col" className="px-4 py-2">
              Verdict
            </th>
            <th scope="col" className="px-4 py-2">
              Risk level
            </th>
            <th scope="col" className="px-4 py-2">
              Updated
            </th>
            <th scope="col" className="px-4 py-2">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {assessments.map((assessment) => (
            <tr key={assessment.id} className="border-b last:border-0 hover:bg-accent/50">
              <th scope="row" className="px-4 py-2 font-medium">
                <Link href={`/risk/${assessment.id}`} className="hover:underline">
                  {assessment.title}
                </Link>
              </th>
              <td className="px-4 py-2">
                {assessment.subject.kindLabel} · {assessment.subject.name}
              </td>
              <td className="px-4 py-2">
                <RiskStatusBadge label={assessment.verdict.label} tone={assessment.verdict.tone} />
              </td>
              <td className="px-4 py-2">
                <RiskStatusBadge
                  label={assessment.riskLevel.label}
                  tone={assessment.riskLevel.tone}
                />
              </td>
              <td className="px-4 py-2">{assessment.updatedLabel}</td>
              <td className="px-4 py-2">
                <RiskStatusBadge label={assessment.status.label} tone={assessment.status.tone} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
