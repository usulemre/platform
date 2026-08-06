import Link from 'next/link';
import { DatasetStatusBadge } from './dataset-status-badge';
import type { DatasetListItemVm } from '../domain/view-model';

/** Accessible dataset list table. Presentational only. */
export function DatasetTable({ datasets }: { datasets: readonly DatasetListItemVm[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Registered datasets</caption>
        <thead className="border-b bg-muted/50 text-xs uppercase text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-2">
              Name
            </th>
            <th scope="col" className="px-4 py-2">
              Vendor
            </th>
            <th scope="col" className="px-4 py-2">
              Asset class
            </th>
            <th scope="col" className="px-4 py-2">
              Version
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
          {datasets.map((dataset) => (
            <tr key={dataset.id} className="border-b last:border-0 hover:bg-accent/50">
              <th scope="row" className="px-4 py-2 font-medium">
                <Link href={`/datasets/${dataset.id}`} className="hover:underline">
                  {dataset.name}
                </Link>
              </th>
              <td className="px-4 py-2">{dataset.vendor}</td>
              <td className="px-4 py-2">{dataset.assetClass}</td>
              <td className="px-4 py-2">{dataset.version}</td>
              <td className="px-4 py-2">{dataset.updatedLabel}</td>
              <td className="px-4 py-2">
                <DatasetStatusBadge label={dataset.status.label} tone={dataset.status.tone} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
