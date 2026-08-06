import Link from 'next/link';
import { ExperimentStatusBadge } from './experiment-status-badge';
import type { ExperimentListItemVm } from '../domain/view-model';

/** Accessible experiment list table. Presentational only. */
export function ExperimentTable({ experiments }: { experiments: readonly ExperimentListItemVm[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Registered experiments</caption>
        <thead className="border-b bg-muted/50 text-xs uppercase text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-2">
              Title
            </th>
            <th scope="col" className="px-4 py-2">
              Asset class
            </th>
            <th scope="col" className="px-4 py-2">
              Workflow
            </th>
            <th scope="col" className="px-4 py-2">
              Outcome
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
          {experiments.map((experiment) => (
            <tr key={experiment.id} className="border-b last:border-0 hover:bg-accent/50">
              <th scope="row" className="px-4 py-2 font-medium">
                <Link href={`/experiments/${experiment.id}`} className="hover:underline">
                  {experiment.title}
                </Link>
              </th>
              <td className="px-4 py-2">{experiment.assetClass}</td>
              <td className="px-4 py-2">{experiment.workflowLabel}</td>
              <td className="px-4 py-2">
                <ExperimentStatusBadge
                  label={experiment.outcome.label}
                  tone={experiment.outcome.tone}
                />
              </td>
              <td className="px-4 py-2">{experiment.updatedLabel}</td>
              <td className="px-4 py-2">
                <ExperimentStatusBadge
                  label={experiment.status.label}
                  tone={experiment.status.tone}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
