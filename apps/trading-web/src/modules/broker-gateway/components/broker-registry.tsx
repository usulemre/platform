'use client';

import { useMemo, useState } from 'react';
import type { BrokerStatus, Environment, ProviderId } from '@platform/broker-sdk';
import { useBrokers } from '../hooks/use-gateway';
import type { BrokerQuery } from '../domain/query';
import { InfoCard, GatewayLoading, selectClass } from './gateway-atoms';
import { BrokerTable } from './broker-tables';

const PROVIDERS = [
  '',
  'binance',
  'binance-futures',
  'hyperliquid',
  'deribit',
  'interactive-brokers',
  'alpaca',
  'bist',
  'fix',
  'rest',
  'websocket',
] as const;
const STATUSES = [
  '',
  'REGISTERED',
  'CONFIGURED',
  'AUTHENTICATED',
  'CONNECTED',
  'HEALTHY',
  'DEGRADED',
  'DISCONNECTED',
  'ARCHIVED',
] as const;
const ENVS = ['', 'LIVE', 'PAPER', 'SANDBOX'] as const;

/** Broker Registry — the filterable, sortable registry of all brokers registered in the gateway. */
export function BrokerRegistry() {
  const [provider, setProvider] = useState('');
  const [status, setStatus] = useState('');
  const [environment, setEnvironment] = useState('');
  const [search, setSearch] = useState('');

  const query = useMemo<BrokerQuery>(
    () => ({
      providerId: (provider || undefined) as ProviderId | undefined,
      status: (status || undefined) as BrokerStatus | undefined,
      environment: (environment || undefined) as Environment | undefined,
      search: search || undefined,
      sortBy: 'name',
      sortDir: 'asc',
    }),
    [provider, status, environment, search],
  );
  const { data, isLoading } = useBrokers(query);

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
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          aria-label="Provider"
        >
          {PROVIDERS.map((p) => (
            <option key={p} value={p}>
              {p || 'All providers'}
            </option>
          ))}
        </select>
        <select
          className={selectClass}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Status"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s || 'All statuses'}
            </option>
          ))}
        </select>
        <select
          className={selectClass}
          value={environment}
          onChange={(e) => setEnvironment(e.target.value)}
          aria-label="Environment"
        >
          {ENVS.map((e) => (
            <option key={e} value={e}>
              {e || 'All environments'}
            </option>
          ))}
        </select>
      </div>
      <InfoCard title="Registered brokers">
        {isLoading || !data ? <GatewayLoading /> : <BrokerTable rows={data} />}
      </InfoCard>
    </div>
  );
}
