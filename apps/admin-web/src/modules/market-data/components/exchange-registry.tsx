'use client';

import { useExchanges } from '../hooks/use-market-data';
import { MarketEmpty, MarketError, MarketLoading } from './market-atoms';

/** Exchange Registry — exchange reference metadata (Exchange Metadata capability). */
export function ExchangeRegistry() {
  const { data, isLoading, isError, refetch } = useExchanges();

  if (isLoading) return <MarketLoading />;
  if (isError) return <MarketError onRetry={() => refetch()} />;
  if (!data || data.length === 0) return <MarketEmpty label="No exchanges registered." />;

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Exchange registry</caption>
        <thead className="border-b bg-muted/50 text-xs uppercase text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-2">
              Exchange
            </th>
            <th scope="col" className="px-4 py-2">
              MIC
            </th>
            <th scope="col" className="px-4 py-2">
              Region
            </th>
            <th scope="col" className="px-4 py-2">
              Timezone
            </th>
            <th scope="col" className="px-4 py-2">
              Asset classes
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((exchange) => (
            <tr key={exchange.id} className="border-b last:border-0 hover:bg-accent/50">
              <th scope="row" className="px-4 py-2 font-medium">
                {exchange.name}{' '}
                <span className="font-mono text-xs text-muted-foreground">{exchange.code}</span>
              </th>
              <td className="px-4 py-2 font-mono text-xs">{exchange.mic}</td>
              <td className="px-4 py-2">{exchange.region}</td>
              <td className="px-4 py-2">{exchange.timezone}</td>
              <td className="px-4 py-2 text-muted-foreground">
                {exchange.assetClasses.join(', ')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
