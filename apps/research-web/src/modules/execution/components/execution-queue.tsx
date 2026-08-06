import Link from 'next/link';
import { ExecutionStatusBadge } from './execution-status-badge';
import type { ExecutionListItemVm } from '../domain/view-model';

/** Accessible execution queue table. Presentational only. */
export function ExecutionQueue({ requests }: { requests: readonly ExecutionListItemVm[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Execution queue</caption>
        <thead className="border-b bg-muted/50 text-xs uppercase text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-2">
              Request
            </th>
            <th scope="col" className="px-4 py-2">
              Portfolio
            </th>
            <th scope="col" className="px-4 py-2">
              Mode
            </th>
            <th scope="col" className="px-4 py-2">
              Risk
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
          {requests.map((request) => (
            <tr key={request.id} className="border-b last:border-0 hover:bg-accent/50">
              <th scope="row" className="px-4 py-2 font-medium">
                <Link href={`/execution/${request.id}`} className="hover:underline">
                  {request.title}
                </Link>
              </th>
              <td className="px-4 py-2">{request.portfolioName}</td>
              <td className="px-4 py-2">
                <ExecutionStatusBadge label={request.mode.label} tone={request.mode.tone} />
              </td>
              <td className="px-4 py-2">
                <ExecutionStatusBadge
                  label={request.riskVerdict.label}
                  tone={request.riskVerdict.tone}
                />
              </td>
              <td className="px-4 py-2">{request.updatedLabel}</td>
              <td className="px-4 py-2">
                <ExecutionStatusBadge label={request.status.label} tone={request.status.tone} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
