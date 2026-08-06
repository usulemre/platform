'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Input } from '@platform/ui';
import { ASSET_CLASSES, assetClassLabel } from '@platform/market-data-sdk';
import { useSymbols } from '../hooks/use-market-data';
import { useSymbolQueryStore } from '../hooks/use-query-stores';
import type { AssetClass } from '../domain/dto';
import type { SymbolQuery } from '../domain/query';
import { MarketEmpty, MarketError, MarketLoading, StatusBadge } from './market-atoms';

const selectClass =
  'h-10 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

const CLASS_OPTIONS: readonly (AssetClass | 'ALL')[] = ['ALL', ...ASSET_CLASSES];

/** Symbol Registry list with canonical/native/alias search and asset-class filter. */
export function SymbolRegistry() {
  const search = useSymbolQueryStore((state) => state.search);
  const assetClass = useSymbolQueryStore((state) => state.assetClass);
  const setSearch = useSymbolQueryStore((state) => state.setSearch);
  const setAssetClass = useSymbolQueryStore((state) => state.setAssetClass);

  const query = useMemo<SymbolQuery>(() => ({ search, assetClass }), [search, assetClass]);
  const { data, isLoading, isError, refetch } = useSymbols(query);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          aria-label="Search symbols"
          placeholder="Search canonical / native / alias…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="sm:max-w-xs"
        />
        <select
          aria-label="Filter by asset class"
          className={selectClass}
          value={assetClass}
          onChange={(event) => setAssetClass(event.target.value as AssetClass | 'ALL')}
        >
          {CLASS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option === 'ALL' ? 'All asset classes' : assetClassLabel(option)}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <MarketLoading />
      ) : isError ? (
        <MarketError onRetry={() => refetch()} />
      ) : !data || data.length === 0 ? (
        <MarketEmpty label="No symbols match your filters." />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Symbol registry</caption>
            <thead className="border-b bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-2">
                  Canonical
                </th>
                <th scope="col" className="px-4 py-2">
                  Native
                </th>
                <th scope="col" className="px-4 py-2">
                  Kind
                </th>
                <th scope="col" className="px-4 py-2">
                  Asset class
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((symbol) => (
                <tr key={symbol.id} className="border-b last:border-0 hover:bg-accent/50">
                  <th scope="row" className="px-4 py-2 font-medium">
                    <Link
                      href={`/market-data/symbols/${symbol.id}`}
                      className="font-mono hover:underline"
                    >
                      {symbol.canonical}
                    </Link>
                  </th>
                  <td className="px-4 py-2 font-mono text-xs text-muted-foreground">
                    {symbol.native}
                  </td>
                  <td className="px-4 py-2">{symbol.kind}</td>
                  <td className="px-4 py-2">
                    <StatusBadge label={symbol.assetClass.label} tone={symbol.assetClass.tone} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
