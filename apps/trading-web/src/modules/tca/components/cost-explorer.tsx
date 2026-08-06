'use client';

import { useMemo, useState } from 'react';
import type { ExecutionMode, Side } from '@platform/tca-sdk';
import { useExecutions } from '../hooks/use-tca';
import type { ExecutionQuery } from '../domain/query';
import { InfoCard, TcaLoading, selectClass } from './tca-atoms';
import { ExecutionTable } from './tca-tables';

const SYMBOLS = ['', 'AAPL', 'MSFT', 'TSLA', 'NVDA', 'SPY'] as const;
const VENUES = ['', 'XNAS', 'ARCA', 'BATS', 'EDGX', 'IEX'] as const;
const SIDES = ['', 'BUY', 'SELL'] as const;
const MODES = ['', 'LIVE', 'PAPER', 'SIMULATED'] as const;

/** Execution Cost Explorer — filterable, sortable table of analyzed executions. */
export function ExecutionCostExplorer() {
  const [symbol, setSymbol] = useState('');
  const [venue, setVenue] = useState('');
  const [side, setSide] = useState('');
  const [mode, setMode] = useState('');
  const [search, setSearch] = useState('');

  const query = useMemo<ExecutionQuery>(
    () => ({
      symbol: symbol || undefined,
      venue: venue || undefined,
      side: (side || undefined) as Side | undefined,
      mode: (mode || undefined) as ExecutionMode | undefined,
      search: search || undefined,
      sortBy: 'executedAt',
      sortDir: 'desc',
    }),
    [symbol, venue, side, mode, search],
  );
  const { data, isLoading } = useExecutions(query);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          className={selectClass}
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search"
        />
        <select
          className={selectClass}
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          aria-label="Symbol"
        >
          {SYMBOLS.map((s) => (
            <option key={s} value={s}>
              {s || 'All symbols'}
            </option>
          ))}
        </select>
        <select
          className={selectClass}
          value={venue}
          onChange={(e) => setVenue(e.target.value)}
          aria-label="Venue"
        >
          {VENUES.map((v) => (
            <option key={v} value={v}>
              {v || 'All venues'}
            </option>
          ))}
        </select>
        <select
          className={selectClass}
          value={side}
          onChange={(e) => setSide(e.target.value)}
          aria-label="Side"
        >
          {SIDES.map((s) => (
            <option key={s} value={s}>
              {s || 'All sides'}
            </option>
          ))}
        </select>
        <select
          className={selectClass}
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          aria-label="Mode"
        >
          {MODES.map((m) => (
            <option key={m} value={m}>
              {m || 'All modes'}
            </option>
          ))}
        </select>
      </div>
      <InfoCard title="Executions">
        {isLoading || !data ? <TcaLoading /> : <ExecutionTable rows={data} />}
      </InfoCard>
    </div>
  );
}
