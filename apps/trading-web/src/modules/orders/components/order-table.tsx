import Link from 'next/link';
import type { OrderRowVm } from '../domain/view-model';
import { OrdEmpty, StatusBadge } from './orders-atoms';

/** The reusable order blotter table. Rows link to the order detail. */
export function OrderTable({
  rows,
  emptyLabel = 'No orders.',
}: {
  rows: readonly OrderRowVm[];
  emptyLabel?: string;
}) {
  if (rows.length === 0) return <OrdEmpty label={emptyLabel} />;
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-3 py-1.5 text-left font-medium">Client ID</th>
            <th className="px-3 py-1.5 text-left font-medium">Symbol</th>
            <th className="px-3 py-1.5 text-left font-medium">Side</th>
            <th className="px-3 py-1.5 text-left font-medium">Type</th>
            <th className="px-3 py-1.5 text-right font-medium">Qty</th>
            <th className="px-3 py-1.5 text-right font-medium">Filled</th>
            <th className="px-3 py-1.5 text-right font-medium">Avg</th>
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
                  href={`/orders/${row.id}`}
                  className="text-foreground underline-offset-2 hover:underline"
                >
                  {row.clientOrderId}
                </Link>
              </td>
              <td className="px-3 py-1 font-medium">{row.symbol}</td>
              <td className="px-3 py-1">
                <StatusBadge label={row.side.label} tone={row.side.tone} />
              </td>
              <td className="px-3 py-1 text-muted-foreground">{row.type}</td>
              <td className="px-3 py-1 text-right font-mono">{row.quantity}</td>
              <td className="px-3 py-1 text-right font-mono">{row.filled}</td>
              <td className="px-3 py-1 text-right font-mono">{row.avgPrice}</td>
              <td className="px-3 py-1">
                <StatusBadge label={row.mode.label} tone={row.mode.tone} />
              </td>
              <td className="px-3 py-1">
                <StatusBadge label={row.status.label} tone={row.status.tone} />
                {row.suspended ? (
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
