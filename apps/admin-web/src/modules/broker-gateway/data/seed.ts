/**
 * Synthetic broker aggregates for the Broker Gateway UI mock. Inert reference + snapshot DATA only —
 * NO exchange/broker SDK, NO API keys (credentials are references), NO FIX, NO connectivity, no
 * persistence. Health is computed with the REAL `@platform/broker-sdk` health rules; the lifecycle
 * event log is a compact, consistent trail for display. This is the UI's own mock, independent of the
 * service tier.
 */
import {
  computeBrokerHealth,
  describeProvider,
  type AssetClass,
  type Broker,
  type BrokerAccount,
  type BrokerCapabilityType,
  type BrokerEvent,
  type BrokerStatus,
  type Environment,
  type GatewayConfiguration,
  type ProviderId,
} from '@platform/broker-sdk';

interface Spec {
  readonly id: string;
  readonly name: string;
  readonly providerId: ProviderId;
  readonly environment: Environment;
  readonly region: string;
  readonly status: BrokerStatus;
  readonly latencyMs: number;
  readonly errorRate: number;
  readonly heartbeatAgeMs: number;
  readonly reconnects: number;
  readonly account?: BrokerAccount;
  readonly failoverBrokerId?: string;
}

const T = '2026-08-05T13:00:00.000Z';
const HEARTBEAT_INTERVAL = 1000;

function config(spec: Spec, capabilities: readonly BrokerCapabilityType[]): GatewayConfiguration {
  const descriptor = describeProvider(spec.providerId);
  return {
    brokerId: spec.id,
    providerId: spec.providerId,
    endpointRef: `config://brokers/${spec.id}/endpoint`,
    credentialRef: `secret://brokers/${spec.id}/api-key`,
    transport: descriptor.transport,
    environment: spec.environment,
    heartbeatIntervalMs: HEARTBEAT_INTERVAL,
    reconnectMaxAttempts: 5,
    capabilities,
    version: 1,
  };
}

/** The lifecycle path (for a compact event/state trail) up to the given end status. */
function path(status: BrokerStatus): readonly BrokerStatus[] {
  const base: BrokerStatus[] = [
    'REGISTERED',
    'CONFIGURED',
    'AUTHENTICATED',
    'CONNECTED',
    'HEALTHY',
  ];
  switch (status) {
    case 'REGISTERED':
      return ['REGISTERED'];
    case 'CONFIGURED':
      return ['REGISTERED', 'CONFIGURED'];
    case 'AUTHENTICATED':
      return ['REGISTERED', 'CONFIGURED', 'AUTHENTICATED'];
    case 'CONNECTED':
      return ['REGISTERED', 'CONFIGURED', 'AUTHENTICATED', 'CONNECTED'];
    case 'HEALTHY':
      return base;
    case 'DEGRADED':
      return ['REGISTERED', 'CONFIGURED', 'AUTHENTICATED', 'CONNECTED', 'DEGRADED'];
    case 'DISCONNECTED':
      return ['REGISTERED', 'CONFIGURED', 'AUTHENTICATED', 'CONNECTED', 'HEALTHY', 'DISCONNECTED'];
    case 'ARCHIVED':
      return ['REGISTERED', 'CONFIGURED', 'AUTHENTICATED', 'CONNECTED', 'DISCONNECTED', 'ARCHIVED'];
  }
}

function build(spec: Spec): Broker {
  const descriptor = describeProvider(spec.providerId);
  const capabilities: readonly BrokerCapabilityType[] = descriptor.capabilities;
  const cfg = config(spec, capabilities);
  const statuses = path(spec.status);
  const events: BrokerEvent[] = statuses.map((status, i) => ({
    id: `${spec.id}:evt:${i}`,
    brokerId: spec.id,
    type: status,
    status,
    message: `${status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, ' ')}.`,
    actor: 'seed',
    at: T,
  }));
  const health = computeBrokerHealth({
    brokerId: spec.id,
    status: spec.status,
    heartbeatAgeMs: spec.heartbeatAgeMs,
    latencyMs: spec.latencyMs,
    errorRate: spec.errorRate,
    heartbeatIntervalMs: HEARTBEAT_INTERVAL,
    at: T,
  });
  const connected =
    spec.status === 'CONNECTED' || spec.status === 'HEALTHY' || spec.status === 'DEGRADED';
  const session =
    statuses.includes('AUTHENTICATED') && spec.status !== 'ARCHIVED'
      ? {
          id: `${spec.id}:sess`,
          brokerId: spec.id,
          state: spec.status === 'DISCONNECTED' ? ('EXPIRED' as const) : ('OPEN' as const),
          tokenRef: `${cfg.credentialRef}#token`,
          openedAt: T,
          lastActivityAt: T,
        }
      : undefined;

  return {
    id: spec.id,
    name: spec.name,
    providerId: descriptor.id,
    providerName: descriptor.name,
    kind: descriptor.kind,
    transport: descriptor.transport,
    environment: spec.environment,
    region: spec.region,
    status: spec.status,
    assetClasses: descriptor.assetClasses as readonly AssetClass[],
    capabilities: capabilities.map((type) => ({
      type,
      enabled: true,
      lastCheckedAt: connected ? T : undefined,
    })),
    configuration: cfg,
    connection: {
      brokerId: spec.id,
      transport: descriptor.transport,
      endpointRef: cfg.endpointRef,
      status: spec.status,
      connectedAt: connected ? T : undefined,
      disconnectedAt: spec.status === 'DISCONNECTED' || spec.status === 'ARCHIVED' ? T : undefined,
      lastHeartbeatAt: connected ? T : undefined,
      reconnectAttempts: spec.reconnects,
      latencyMs: spec.latencyMs,
    },
    session,
    account: spec.account,
    health: { ...health, errorRate: spec.errorRate },
    failoverBrokerId: spec.failoverBrokerId,
    events,
    states: statuses.map((status) => ({ status, at: T, note: `${status}.` })),
    audit: events.map((e) => ({
      id: `${e.id}:aud`,
      brokerId: spec.id,
      actor: e.actor,
      action: e.type,
      detail: e.message,
      at: e.at,
    })),
    reconnectAttempts: spec.reconnects,
    createdAt: T,
    updatedAt: T,
  };
}

function cryptoAccount(brokerId: string, base: string): BrokerAccount {
  return {
    id: `${brokerId}:acct`,
    brokerId,
    accountRef: `${brokerId}-main`,
    type: 'MARGIN',
    baseCurrency: base,
    positions: [
      { symbol: 'BTCUSDT', quantity: 1.5, averagePrice: 61000, assetClass: 'CRYPTO' },
      { symbol: 'ETHUSDT', quantity: -8, averagePrice: 3400, assetClass: 'CRYPTO' },
    ],
    balances: [
      { currency: base, total: 250000, available: 180000 },
      { currency: 'BTC', total: 1.5, available: 1.5 },
    ],
    orders: [
      {
        brokerOrderId: 'B-1001',
        clientOrderId: 'OMS-1001',
        symbol: 'BTCUSDT',
        status: 'PARTIALLY_FILLED',
        filledQuantity: 0.5,
        remainingQuantity: 1.0,
      },
      {
        brokerOrderId: 'B-1002',
        clientOrderId: 'OMS-1002',
        symbol: 'ETHUSDT',
        status: 'FILLED',
        filledQuantity: 8,
        remainingQuantity: 0,
      },
    ],
    syncedAt: T,
  };
}

function equityAccount(brokerId: string): BrokerAccount {
  return {
    id: `${brokerId}:acct`,
    brokerId,
    accountRef: `${brokerId}-main`,
    type: 'MARGIN',
    baseCurrency: 'USD',
    positions: [
      { symbol: 'AAPL', quantity: 1200, averagePrice: 190.2, assetClass: 'EQUITY' },
      { symbol: 'MSFT', quantity: 400, averagePrice: 430.5, assetClass: 'EQUITY' },
    ],
    balances: [{ currency: 'USD', total: 1_200_000, available: 850_000 }],
    orders: [
      {
        brokerOrderId: 'B-2001',
        clientOrderId: 'OMS-2001',
        symbol: 'AAPL',
        status: 'NEW',
        filledQuantity: 0,
        remainingQuantity: 1000,
      },
    ],
    syncedAt: T,
  };
}

const SPECS: readonly Spec[] = [
  {
    id: 'BRK-0001',
    name: 'Binance Prod',
    providerId: 'binance',
    environment: 'LIVE',
    region: 'ap-northeast-1',
    status: 'HEALTHY',
    latencyMs: 45,
    errorRate: 0.0,
    heartbeatAgeMs: 400,
    reconnects: 0,
    account: cryptoAccount('BRK-0001', 'USDT'),
  },
  {
    id: 'BRK-0002',
    name: 'Binance Futures Prod',
    providerId: 'binance-futures',
    environment: 'LIVE',
    region: 'ap-northeast-1',
    status: 'HEALTHY',
    latencyMs: 60,
    errorRate: 0.005,
    heartbeatAgeMs: 500,
    reconnects: 0,
    account: cryptoAccount('BRK-0002', 'USDT'),
  },
  {
    id: 'BRK-0003',
    name: 'Hyperliquid Prod',
    providerId: 'hyperliquid',
    environment: 'LIVE',
    region: 'us-east-1',
    status: 'DEGRADED',
    latencyMs: 420,
    errorRate: 0.03,
    heartbeatAgeMs: 2500,
    reconnects: 1,
    account: cryptoAccount('BRK-0003', 'USDC'),
  },
  {
    id: 'BRK-0004',
    name: 'Deribit Prod',
    providerId: 'deribit',
    environment: 'LIVE',
    region: 'eu-west-1',
    status: 'CONNECTED',
    latencyMs: 80,
    errorRate: 0.0,
    heartbeatAgeMs: 600,
    reconnects: 0,
    account: cryptoAccount('BRK-0004', 'USDC'),
  },
  {
    id: 'BRK-0005',
    name: 'IBKR Prod',
    providerId: 'interactive-brokers',
    environment: 'LIVE',
    region: 'us-east-1',
    status: 'HEALTHY',
    latencyMs: 55,
    errorRate: 0.0,
    heartbeatAgeMs: 300,
    reconnects: 0,
    account: equityAccount('BRK-0005'),
  },
  {
    id: 'BRK-0006',
    name: 'Alpaca Paper',
    providerId: 'alpaca',
    environment: 'PAPER',
    region: 'us-east-1',
    status: 'DISCONNECTED',
    latencyMs: 90,
    errorRate: 0.15,
    heartbeatAgeMs: 30000,
    reconnects: 3,
    account: equityAccount('BRK-0006'),
    failoverBrokerId: 'BRK-0005',
  },
  {
    id: 'BRK-0007',
    name: 'BIST Sandbox',
    providerId: 'bist',
    environment: 'SANDBOX',
    region: 'eu-central-1',
    status: 'REGISTERED',
    latencyMs: 0,
    errorRate: 0,
    heartbeatAgeMs: 0,
    reconnects: 0,
  },
  {
    id: 'BRK-0008',
    name: 'FIX Session A',
    providerId: 'fix',
    environment: 'PAPER',
    region: 'eu-west-1',
    status: 'AUTHENTICATED',
    latencyMs: 0,
    errorRate: 0,
    heartbeatAgeMs: 0,
    reconnects: 0,
  },
  {
    id: 'BRK-0009',
    name: 'Legacy REST',
    providerId: 'rest',
    environment: 'PAPER',
    region: 'us-west-2',
    status: 'ARCHIVED',
    latencyMs: 120,
    errorRate: 0.2,
    heartbeatAgeMs: 60000,
    reconnects: 2,
  },
  {
    id: 'BRK-0010',
    name: 'WS Gateway',
    providerId: 'websocket',
    environment: 'LIVE',
    region: 'ap-southeast-1',
    status: 'HEALTHY',
    latencyMs: 35,
    errorRate: 0.0,
    heartbeatAgeMs: 350,
    reconnects: 0,
    account: cryptoAccount('BRK-0010', 'USDT'),
  },
];

export const BROKERS: readonly Broker[] = SPECS.map(build);
