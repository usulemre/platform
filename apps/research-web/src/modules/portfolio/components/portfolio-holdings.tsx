import { Card, CardContent, CardHeader, CardTitle } from '@platform/ui';
import { EmptyState } from '@platform/shell';
import { Wallet } from 'lucide-react';
import type { HoldingVm } from '../domain/view-model';

/**
 * Holdings view — the proposed holdings/positions. Weights are pre-supplied
 * metadata (no position sizing is performed here). Accessible table.
 */
export function PortfolioHoldings({ holdings }: { holdings: readonly HoldingVm[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Holdings</CardTitle>
      </CardHeader>
      <CardContent>
        {holdings.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="No holdings"
            description="No proposed holdings in this snapshot."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Proposed holdings</caption>
              <thead className="border-b text-xs uppercase text-muted-foreground">
                <tr>
                  <th scope="col" className="py-2 pr-4">
                    Instrument
                  </th>
                  <th scope="col" className="py-2 pr-4">
                    Asset class
                  </th>
                  <th scope="col" className="py-2 pr-4">
                    Side
                  </th>
                  <th scope="col" className="py-2 text-right">
                    Weight
                  </th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((holding) => (
                  <tr key={holding.id} className="border-b last:border-0">
                    <th scope="row" className="py-2 pr-4 font-medium">
                      {holding.instrument}
                    </th>
                    <td className="py-2 pr-4">{holding.assetClass}</td>
                    <td className="py-2 pr-4">{holding.side}</td>
                    <td className="py-2 text-right font-medium">{holding.weight}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
