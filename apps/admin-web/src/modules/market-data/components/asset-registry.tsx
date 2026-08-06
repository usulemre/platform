'use client';

import { useAssets } from '../hooks/use-market-data';
import { MarketEmpty, MarketError, MarketLoading, StatusBadge } from './market-atoms';

/** Asset Registry — canonical assets and their class. */
export function AssetRegistry() {
  const { data, isLoading, isError, refetch } = useAssets();

  if (isLoading) return <MarketLoading />;
  if (isError) return <MarketError onRetry={() => refetch()} />;
  if (!data || data.length === 0) return <MarketEmpty label="No assets registered." />;

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Asset registry</caption>
        <thead className="border-b bg-muted/50 text-xs uppercase text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-2">
              Symbol
            </th>
            <th scope="col" className="px-4 py-2">
              Name
            </th>
            <th scope="col" className="px-4 py-2">
              Asset class
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((asset) => (
            <tr key={asset.id} className="border-b last:border-0 hover:bg-accent/50">
              <th scope="row" className="px-4 py-2 font-mono font-medium">
                {asset.symbol}
              </th>
              <td className="px-4 py-2">{asset.name}</td>
              <td className="px-4 py-2">
                <StatusBadge label={asset.assetClass.label} tone={asset.assetClass.tone} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
