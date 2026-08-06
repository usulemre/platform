/**
 * Deterministic seed brokers for the broker-gateway service (development/test only). Each broker is
 * built by walking the REAL lifecycle state machine (register → configure → authenticate → connect →
 * health check, plus failover/archive) so its event log replays consistently. Synthetic reference and
 * snapshot DATA only — NO exchange/broker SDK, NO API keys (credentials are references), NO FIX, NO
 * connectivity.
 */
import type {
  Broker,
  BrokerAccount,
  BrokerCapabilityType,
  Environment,
  GatewayConfiguration,
  ProviderId,
} from '@platform/broker-sdk';
import { CAPABILITY_TYPES, describeProvider } from '@platform/broker-sdk';
import {
  applyAction,
  archive,
  authenticate,
  configure,
  connect,
  createBroker,
  recomputeHealthStatus,
  type TransitionResult,
} from '../../domain/lifecycle';

function must(result: TransitionResult): Broker {
  if (!result.ok) throw new Error(`seed lifecycle error: ${result.reason}`);
  return result.broker;
}

type EndState =
  | 'REGISTERED'
  | 'CONFIGURED'
  | 'AUTHENTICATED'
  | 'CONNECTED'
  | 'HEALTHY'
  | 'DEGRADED'
  | 'DISCONNECTED'
  | 'ARCHIVED';

interface Spec {
  readonly id: string;
  readonly name: string;
  readonly providerId: ProviderId;
  readonly environment: Environment;
  readonly region: string;
  readonly end: EndState;
  readonly latencyMs: number;
  readonly errorRate: number;
  readonly at: string;
  readonly account?: BrokerAccount;
  readonly failoverBrokerId?: string;
}

function config(spec: Spec): GatewayConfiguration {
  const descriptor = describeProvider(spec.providerId);
  const capabilities: readonly BrokerCapabilityType[] = descriptor.capabilities.length
    ? descriptor.capabilities
    : CAPABILITY_TYPES;
  return {
    brokerId: spec.id,
    providerId: spec.providerId,
    endpointRef: `config://brokers/${spec.id}/endpoint`,
    credentialRef: `secret://brokers/${spec.id}/api-key`,
    transport: descriptor.transport,
    environment: spec.environment,
    heartbeatIntervalMs: 1000,
    reconnectMaxAttempts: 5,
    capabilities,
    version: 1,
  };
}

function build(spec: Spec): Broker {
  const t = spec.at;
  let broker = createBroker({
    id: spec.id,
    name: spec.name,
    configuration: config(spec),
    region: spec.region,
    actor: 'seed',
    at: t,
  });
  if (spec.end === 'REGISTERED') return attach(broker, spec);

  broker = must(configure(broker, 'seed', t));
  if (spec.end === 'CONFIGURED') return attach(broker, spec);

  broker = must(authenticate(broker, 'seed', t));
  if (spec.end === 'AUTHENTICATED') return attach(broker, spec);

  broker = must(connect(broker, 'seed', t, spec.latencyMs));
  // Bind the error rate used by health computation.
  broker = { ...broker, health: { ...broker.health, errorRate: spec.errorRate } };
  if (spec.end === 'CONNECTED') return attach(broker, spec);

  // Health check lands on HEALTHY or DEGRADED based on latency/error inputs.
  broker = must(recomputeHealthStatus(broker, 'seed', t));
  if (spec.end === 'HEALTHY' || spec.end === 'DEGRADED') return attach(broker, spec);

  if (spec.end === 'DISCONNECTED') {
    broker = must(applyAction(broker, 'failover', 'seed', t, spec.failoverBrokerId));
    return attach(broker, spec);
  }
  if (spec.end === 'ARCHIVED') {
    broker = must(applyAction(broker, 'failover', 'seed', t, spec.failoverBrokerId));
    broker = must(archive(broker, 'seed', t));
    return attach(broker, spec);
  }
  return attach(broker, spec);
}

function attach(broker: Broker, spec: Spec): Broker {
  return spec.account
    ? {
        ...broker,
        account: spec.account,
        failoverBrokerId: spec.failoverBrokerId ?? broker.failoverBrokerId,
      }
    : { ...broker, failoverBrokerId: spec.failoverBrokerId ?? broker.failoverBrokerId };
}

function account(brokerId: string, base: string, at: string): BrokerAccount {
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
    syncedAt: at,
  };
}

function equityAccount(brokerId: string, at: string): BrokerAccount {
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
    syncedAt: at,
  };
}

const T = '2026-08-05T13:00:00.000Z';

const SPECS: readonly Spec[] = [
  {
    id: 'BRK-0001',
    name: 'Binance Prod',
    providerId: 'binance',
    environment: 'LIVE',
    region: 'ap-northeast-1',
    end: 'HEALTHY',
    latencyMs: 45,
    errorRate: 0.0,
    at: T,
    account: account('BRK-0001', 'USDT', T),
  },
  {
    id: 'BRK-0002',
    name: 'Binance Futures Prod',
    providerId: 'binance-futures',
    environment: 'LIVE',
    region: 'ap-northeast-1',
    end: 'HEALTHY',
    latencyMs: 60,
    errorRate: 0.005,
    at: T,
    account: account('BRK-0002', 'USDT', T),
  },
  {
    id: 'BRK-0003',
    name: 'Hyperliquid Prod',
    providerId: 'hyperliquid',
    environment: 'LIVE',
    region: 'us-east-1',
    end: 'DEGRADED',
    latencyMs: 420,
    errorRate: 0.03,
    at: T,
    account: account('BRK-0003', 'USDC', T),
  },
  {
    id: 'BRK-0004',
    name: 'Deribit Prod',
    providerId: 'deribit',
    environment: 'LIVE',
    region: 'eu-west-1',
    end: 'CONNECTED',
    latencyMs: 80,
    errorRate: 0.0,
    at: T,
    account: account('BRK-0004', 'USDC', T),
  },
  {
    id: 'BRK-0005',
    name: 'IBKR Prod',
    providerId: 'interactive-brokers',
    environment: 'LIVE',
    region: 'us-east-1',
    end: 'HEALTHY',
    latencyMs: 55,
    errorRate: 0.0,
    at: T,
    account: equityAccount('BRK-0005', T),
  },
  {
    id: 'BRK-0006',
    name: 'Alpaca Paper',
    providerId: 'alpaca',
    environment: 'PAPER',
    region: 'us-east-1',
    end: 'DISCONNECTED',
    latencyMs: 90,
    errorRate: 0.15,
    at: T,
    account: equityAccount('BRK-0006', T),
    failoverBrokerId: 'BRK-0005',
  },
  {
    id: 'BRK-0007',
    name: 'BIST Sandbox',
    providerId: 'bist',
    environment: 'SANDBOX',
    region: 'eu-central-1',
    end: 'REGISTERED',
    latencyMs: 0,
    errorRate: 0,
    at: T,
  },
  {
    id: 'BRK-0008',
    name: 'FIX Session A',
    providerId: 'fix',
    environment: 'PAPER',
    region: 'eu-west-1',
    end: 'AUTHENTICATED',
    latencyMs: 0,
    errorRate: 0,
    at: T,
  },
  {
    id: 'BRK-0009',
    name: 'Legacy REST',
    providerId: 'rest',
    environment: 'PAPER',
    region: 'us-west-2',
    end: 'ARCHIVED',
    latencyMs: 120,
    errorRate: 0.2,
    at: T,
  },
  {
    id: 'BRK-0010',
    name: 'WS Gateway',
    providerId: 'websocket',
    environment: 'LIVE',
    region: 'ap-southeast-1',
    end: 'HEALTHY',
    latencyMs: 35,
    errorRate: 0.0,
    at: T,
    account: account('BRK-0010', 'USDT', T),
  },
];

export const BROKERS: readonly Broker[] = SPECS.map(build);
