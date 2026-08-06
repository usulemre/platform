import Link from 'next/link';
import type { ExecutionRowVm } from '../domain/view-model';
import { ExecEmpty, StatusBadge } from './execution-atoms';

/** The reusable execution table. Rows link to the execution detail. */
export function ExecutionTable({
  rows,
  emptyLabel = 'No executions.',
}: {
  rows: readonly ExecutionRowVm[];
  emptyLabel?: string;
}) {
  if (rows.length === 0) return <ExecEmpty label={emptyLabel} />;
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-3 py-1.5 text-left font-medium">Client ID</th>
            <th className="px-3 py-1.5 text-left font-medium">Symbol</th>
            <th className="px-3 py-1.5 text-left font-medium">Side</th>
            <th className="px-3 py-1.5 text-right font-medium">Qty</th>
            <th className="px-3 py-1.5 text-right font-medium">Executed</th>
            <th className="px-3 py-1.5 text-right font-medium">Avg</th>
            <th className="px-3 py-1.5 text-left font-medium">Venue</th>
            <th className="px-3 py-1.5 text-left font-medium">Mode</th>
            <th className="px-3 py-1.5 text-left font-medium">Status</th>
            <th className="px-3 py-1.5 text-left font-medium">Updated</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t hover:bg-accent/40">
              <td className="px-3 py-1 font-mono text-xs">
                <Link
                  href={`/execution/${row.id}`}
                  className="text-foreground underline-offset-2 hover:underline"
                >
                  {row.clientOrderId}
                </Link>
              </td>
              <td className="px-3 py-1 font-medium">{row.symbol}</td>
              <td className="px-3 py-1">
                <StatusBadge label={row.side.label} tone={row.side.tone} />
              </td>
              <td className="px-3 py-1 text-right font-mono">{row.quantity}</td>
              <td className="px-3 py-1 text-right font-mono">{row.executed}</td>
              <td className="px-3 py-1 text-right font-mono">{row.avgPrice}</td>
              <td className="px-3 py-1 text-xs text-muted-foreground">{row.venue}</td>
              <td className="px-3 py-1">
                <StatusBadge label={row.mode.label} tone={row.mode.tone} />
              </td>
              <td className="px-3 py-1">
                <StatusBadge label={row.status.label} tone={row.status.tone} />
                {row.paused ? (
                  <span className="ml-1 text-[10px] uppercase text-amber-600">held</span>
                ) : null}
              </td>
              <td className="px-3 py-1 font-mono text-xs text-muted-foreground">
                {row.updatedLabel}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
