/**
 * In-memory mock adapter for development. Synthetic connector METADATA ONLY — no
 * external communication, no HTTP clients, no provider SDKs, no persistence (all
 * out of scope / forbidden). Every entry is a connector ABSTRACTION; real
 * implementations belong to future infrastructure packages.
 *
 * Credential material is NEVER present — only brokered `secretRef` pointers
 * (CLAUDE.md SEC-3). This roster is the initial Connector Registry.
 */
import type {
  ActivityEventDto,
  ConnectorCapabilityDto,
  ConnectorConfigFieldDto,
  ConnectorCredentialDto,
  ConnectorDiagnosticDto,
  ConnectorDto,
  ConnectorHealthDto,
  ConnectorMetricsDto,
  ConnectorStatusDto,
  ConnectorTypeDto,
  ConnectorVersionDto,
  EnvironmentDto,
  LifecycleEventDto,
  ValidationReportDto,
} from '../domain/dto';
import { applyConnectorQuery, type ConnectorQuery } from '../domain/query';
import type { ConnectorRepository } from './repository';

const EMPTY_METRICS: ConnectorMetricsDto = {
  requestsToDate: '—',
  errorRate: '—',
  avgLatency: '—',
  rateLimit: '—',
};

function lifecycleFor(
  status: ConnectorStatusDto,
  dates: { registeredAt: string; enabledAt?: string; changedAt?: string },
): LifecycleEventDto[] {
  const registered: LifecycleEventDto = {
    stage: 'registered',
    label: 'Registered',
    occurredAt: dates.registeredAt,
  };
  const enabledAt = dates.enabledAt ?? dates.registeredAt;
  const changedAt = dates.changedAt ?? enabledAt;

  switch (status) {
    case 'REGISTERED':
      return [
        registered,
        { stage: 'configured', label: 'Configuration' },
        { stage: 'enabled', label: 'Enabled' },
        { stage: 'retirement', label: 'Retirement' },
      ];
    case 'ENABLED':
      return [
        registered,
        { stage: 'configured', label: 'Configured', occurredAt: dates.registeredAt },
        { stage: 'enabled', label: 'Enabled', occurredAt: enabledAt },
        { stage: 'retirement', label: 'Retirement' },
      ];
    case 'MAINTENANCE':
      return [
        registered,
        { stage: 'configured', label: 'Configured', occurredAt: dates.registeredAt },
        { stage: 'enabled', label: 'Enabled', occurredAt: enabledAt },
        { stage: 'maintenance', label: 'Maintenance window' },
        { stage: 'retirement', label: 'Retirement' },
      ];
    case 'DISABLED':
      return [
        registered,
        { stage: 'configured', label: 'Configured', occurredAt: dates.registeredAt },
        { stage: 'enabled', label: 'Enabled', occurredAt: enabledAt },
        { stage: 'disabled', label: 'Disabled', occurredAt: changedAt },
        { stage: 'retirement', label: 'Retirement' },
      ];
    case 'DEPRECATED':
      return [
        registered,
        { stage: 'enabled', label: 'Enabled', occurredAt: enabledAt },
        { stage: 'deprecated', label: 'Deprecated', occurredAt: changedAt },
        { stage: 'retirement', label: 'Retirement' },
      ];
    case 'RETIRED':
      return [
        registered,
        { stage: 'enabled', label: 'Enabled', occurredAt: enabledAt },
        { stage: 'retired', label: 'Retired', occurredAt: changedAt },
      ];
  }
}

interface SeedInput {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly provider: string;
  readonly description: string;
  readonly type: ConnectorTypeDto;
  readonly status: ConnectorStatusDto;
  readonly environment?: EnvironmentDto;
  readonly owner?: string;
  readonly team?: string;
  readonly version: string;
  readonly registryId?: string;
  readonly registeredAt: string;
  readonly updatedAt: string;
  readonly enabledAt?: string;
  readonly retiredAt?: string;
  readonly health: ConnectorHealthDto;
  readonly capabilities: readonly ConnectorCapabilityDto[];
  readonly metrics?: ConnectorMetricsDto;
  readonly validation?: ValidationReportDto;
  readonly diagnostics?: readonly ConnectorDiagnosticDto[];
  readonly credentials?: readonly ConnectorCredentialDto[];
  readonly configFields?: readonly ConnectorConfigFieldDto[];
  readonly activity: readonly ActivityEventDto[];
  readonly versions: readonly ConnectorVersionDto[];
  readonly tags: readonly string[];
}

function connector(input: SeedInput): ConnectorDto {
  const environment = input.environment ?? 'PRODUCTION';
  const credentials = input.credentials ?? [
    {
      kind: 'API key',
      status: 'CONFIGURED',
      secretRef: `vault://connectors/${input.slug}/api-key`,
      rotatedAt: input.registeredAt,
    },
  ];
  const configFields = input.configFields ?? [
    { key: 'base-url', label: 'Base URL', value: `ref:endpoints/${input.slug}`, secret: false },
    { key: 'timeout-ms', label: 'Timeout (ms)', value: '10000', secret: false },
    {
      key: 'api-key',
      label: 'API key',
      value: `vault://connectors/${input.slug}/api-key`,
      secret: true,
    },
  ];

  return {
    id: input.id,
    slug: input.slug,
    name: input.name,
    provider: input.provider,
    description: input.description,
    type: input.type,
    status: input.status,
    environment,
    owner: input.owner ?? 'DATA',
    team: input.team ?? 'Data Engineering',
    version: input.version,
    registryId: input.registryId ?? `REG-${input.id}`,
    health: input.health,
    configuration: {
      environment,
      configRef: `CFG-${input.id}`,
      fields: configFields,
      updatedAt: input.updatedAt,
    },
    credentials,
    capabilities: input.capabilities,
    metrics: input.metrics ?? EMPTY_METRICS,
    diagnostics: input.diagnostics ?? [],
    validation: input.validation ?? { status: 'NOT_RUN', issues: [] },
    lifecycle: lifecycleFor(input.status, {
      registeredAt: input.registeredAt,
      enabledAt: input.enabledAt,
      changedAt: input.retiredAt ?? input.updatedAt,
    }),
    activity: input.activity,
    versions: input.versions,
    tags: input.tags,
    createdAt: input.registeredAt,
    updatedAt: input.updatedAt,
    registeredAt: input.registeredAt,
    retiredAt: input.retiredAt,
  };
}

const HEALTHY = (
  lastCheckedAt: string,
  latency = '85ms',
  uptime = '99.95%',
): ConnectorHealthDto => ({
  status: 'HEALTHY',
  message: 'Nominal.',
  latency,
  uptime,
  lastCheckedAt,
});

const PASSED = (checkedAt: string): ValidationReportDto => ({
  status: 'PASSED',
  issues: [],
  checkedAt,
});

const SEED: readonly ConnectorDto[] = [
  connector({
    id: 'CN-BINANCE',
    slug: 'binance',
    name: 'Binance',
    provider: 'Binance',
    description:
      'Crypto exchange connector abstraction — spot/perp market data and governed order interfaces.',
    type: 'EXCHANGE',
    status: 'ENABLED',
    owner: 'MKT',
    team: 'Market Data',
    version: '1.4.0',
    registeredAt: '2026-03-02T00:00:00.000Z',
    enabledAt: '2026-03-05T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    health: HEALTHY('2026-08-02T00:00:00.000Z', '62ms', '99.98%'),
    capabilities: [
      { key: 'market-data', label: 'Market data', support: 'SUPPORTED' },
      { key: 'streaming', label: 'WebSocket streaming', support: 'SUPPORTED' },
      {
        key: 'order-entry',
        label: 'Order entry',
        support: 'PARTIAL',
        note: 'Governed execution path only.',
      },
    ],
    metrics: {
      requestsToDate: '18.4M',
      errorRate: '0.02%',
      avgLatency: '62ms',
      rateLimit: '1200/min',
      lastRequestAt: '2026-08-02T00:00:00.000Z',
    },
    diagnostics: [
      { check: 'Endpoint reachability', status: 'PASS', detail: 'Reference endpoint resolvable.' },
      { check: 'Clock skew', status: 'PASS', detail: 'Within tolerance.' },
    ],
    validation: PASSED('2026-07-30T00:00:00.000Z'),
    activity: [
      {
        id: 'e1',
        label: 'Rate-limit configuration updated',
        actor: 'MKT',
        occurredAt: '2026-08-01T00:00:00.000Z',
      },
      {
        id: 'e2',
        label: 'Health check passed',
        actor: 'monitoring',
        occurredAt: '2026-08-02T00:00:00.000Z',
      },
    ],
    versions: [
      {
        version: '1.4.0',
        releasedAt: '2026-07-15T00:00:00.000Z',
        note: 'Streaming reconnect hardening.',
        apiVersion: 'v3',
      },
      {
        version: '1.3.0',
        releasedAt: '2026-05-01T00:00:00.000Z',
        note: 'Initial spot + perp support.',
        apiVersion: 'v3',
      },
    ],
    tags: ['crypto', 'exchange', 'spot', 'perp'],
  }),
  connector({
    id: 'CN-HYPERLIQUID',
    slug: 'hyperliquid',
    name: 'Hyperliquid',
    provider: 'Hyperliquid',
    description:
      'Decentralized perpetuals venue connector abstraction — market data and governed order interfaces.',
    type: 'EXCHANGE',
    status: 'REGISTERED',
    owner: 'MKT',
    team: 'Market Data',
    version: '0.3.0',
    registeredAt: '2026-07-20T00:00:00.000Z',
    updatedAt: '2026-07-28T00:00:00.000Z',
    health: {
      status: 'UNKNOWN',
      message: 'Not yet enabled; awaiting configuration.',
      latency: '—',
      uptime: '—',
      lastCheckedAt: '2026-07-28T00:00:00.000Z',
    },
    capabilities: [
      { key: 'market-data', label: 'Market data', support: 'SUPPORTED' },
      { key: 'streaming', label: 'WebSocket streaming', support: 'PLANNED' },
      { key: 'order-entry', label: 'Order entry', support: 'UNSUPPORTED' },
    ],
    validation: {
      status: 'PENDING',
      checkedAt: '2026-07-28T00:00:00.000Z',
      issues: [
        {
          code: 'CFG-001',
          severity: 'WARNING',
          message: 'Endpoint configuration incomplete; not enable-eligible.',
        },
      ],
    },
    diagnostics: [
      {
        check: 'Endpoint reachability',
        status: 'SKIPPED',
        detail: 'Skipped — connector not enabled.',
      },
    ],
    credentials: [
      {
        kind: 'API key',
        status: 'MISSING',
        secretRef: 'vault://connectors/hyperliquid/api-key',
        rotatedAt: undefined,
      },
    ],
    activity: [
      {
        id: 'e1',
        label: 'Registered in connector registry',
        actor: 'MKT',
        occurredAt: '2026-07-20T00:00:00.000Z',
      },
    ],
    versions: [
      {
        version: '0.3.0',
        releasedAt: '2026-07-20T00:00:00.000Z',
        note: 'Registered; abstraction only.',
      },
    ],
    tags: ['crypto', 'exchange', 'perp', 'defi'],
  }),
  connector({
    id: 'CN-DERIBIT',
    slug: 'deribit',
    name: 'Deribit',
    provider: 'Deribit',
    description:
      'Crypto options venue connector abstraction — options chains, greeks and streaming.',
    type: 'OPTIONS',
    status: 'ENABLED',
    owner: 'MKT',
    team: 'Market Data',
    version: '1.1.0',
    registeredAt: '2026-04-10T00:00:00.000Z',
    enabledAt: '2026-04-14T00:00:00.000Z',
    updatedAt: '2026-07-29T00:00:00.000Z',
    health: HEALTHY('2026-08-02T00:00:00.000Z', '110ms', '99.90%'),
    capabilities: [
      { key: 'chains', label: 'Options chains', support: 'SUPPORTED' },
      { key: 'greeks', label: 'Greeks', support: 'SUPPORTED' },
      { key: 'streaming', label: 'Streaming', support: 'SUPPORTED' },
    ],
    metrics: {
      requestsToDate: '4.9M',
      errorRate: '0.05%',
      avgLatency: '110ms',
      rateLimit: '600/min',
      lastRequestAt: '2026-08-02T00:00:00.000Z',
    },
    diagnostics: [
      { check: 'Endpoint reachability', status: 'PASS', detail: 'Reference endpoint resolvable.' },
      { check: 'Chain completeness', status: 'WARN', detail: 'Sparse chains on far-dated tenors.' },
    ],
    validation: PASSED('2026-07-25T00:00:00.000Z'),
    activity: [
      {
        id: 'e1',
        label: 'Greeks capability re-validated',
        actor: 'validation',
        occurredAt: '2026-07-25T00:00:00.000Z',
      },
    ],
    versions: [
      {
        version: '1.1.0',
        releasedAt: '2026-06-20T00:00:00.000Z',
        note: 'Greeks streaming added.',
        apiVersion: 'v2',
      },
    ],
    tags: ['crypto', 'options', 'derivatives'],
  }),
  connector({
    id: 'CN-POLYGON',
    slug: 'polygon',
    name: 'Polygon.io',
    provider: 'Polygon',
    description: 'US equities and options market data provider connector abstraction.',
    type: 'MARKET_DATA',
    status: 'ENABLED',
    owner: 'MKT',
    team: 'Market Data',
    version: '2.0.0',
    registeredAt: '2026-02-01T00:00:00.000Z',
    enabledAt: '2026-02-04T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    health: HEALTHY('2026-08-02T00:00:00.000Z', '48ms', '99.99%'),
    capabilities: [
      { key: 'historical', label: 'Historical aggregates', support: 'SUPPORTED' },
      { key: 'reference', label: 'Reference data', support: 'SUPPORTED' },
      { key: 'snapshot', label: 'Snapshots', support: 'SUPPORTED' },
    ],
    metrics: {
      requestsToDate: '32.1M',
      errorRate: '0.01%',
      avgLatency: '48ms',
      rateLimit: 'Unlimited (plan)',
      lastRequestAt: '2026-08-02T00:00:00.000Z',
    },
    diagnostics: [
      { check: 'Endpoint reachability', status: 'PASS', detail: 'Reference endpoint resolvable.' },
      { check: 'Corporate actions freshness', status: 'PASS', detail: 'Within SLA.' },
    ],
    validation: PASSED('2026-07-31T00:00:00.000Z'),
    activity: [
      {
        id: 'e1',
        label: 'Plan upgraded; rate limit lifted',
        actor: 'MKT',
        occurredAt: '2026-08-01T00:00:00.000Z',
      },
    ],
    versions: [
      {
        version: '2.0.0',
        releasedAt: '2026-07-01T00:00:00.000Z',
        note: 'v3 REST migration.',
        apiVersion: 'v3',
      },
      {
        version: '1.5.0',
        releasedAt: '2026-04-01T00:00:00.000Z',
        note: 'Options reference added.',
        apiVersion: 'v2',
      },
    ],
    tags: ['equities', 'options', 'market-data'],
  }),
  connector({
    id: 'CN-ALPACA',
    slug: 'alpaca',
    name: 'Alpaca',
    provider: 'Alpaca',
    description:
      'US equities broker connector abstraction — accounts, positions and governed order routing.',
    type: 'BROKER',
    status: 'ENABLED',
    environment: 'SANDBOX',
    owner: 'EXE',
    team: 'Execution',
    version: '1.2.0',
    registeredAt: '2026-03-15T00:00:00.000Z',
    enabledAt: '2026-03-18T00:00:00.000Z',
    updatedAt: '2026-07-30T00:00:00.000Z',
    health: HEALTHY('2026-08-02T00:00:00.000Z', '95ms', '99.80%'),
    capabilities: [
      { key: 'accounts', label: 'Accounts', support: 'SUPPORTED' },
      { key: 'positions', label: 'Positions', support: 'SUPPORTED' },
      {
        key: 'order-entry',
        label: 'Order entry',
        support: 'PARTIAL',
        note: 'Paper/sandbox only; live gated by governance token.',
      },
    ],
    metrics: {
      requestsToDate: '1.2M',
      errorRate: '0.08%',
      avgLatency: '95ms',
      rateLimit: '200/min',
      lastRequestAt: '2026-08-01T00:00:00.000Z',
    },
    diagnostics: [
      { check: 'Endpoint reachability', status: 'PASS', detail: 'Sandbox endpoint resolvable.' },
      {
        check: 'Execution guardrail',
        status: 'PASS',
        detail: 'Live routing disabled without token (RS-4).',
      },
    ],
    validation: PASSED('2026-07-28T00:00:00.000Z'),
    activity: [
      {
        id: 'e1',
        label: 'Sandbox reconfigured',
        actor: 'EXE',
        occurredAt: '2026-07-30T00:00:00.000Z',
      },
    ],
    versions: [
      {
        version: '1.2.0',
        releasedAt: '2026-06-10T00:00:00.000Z',
        note: 'Positions sync added.',
        apiVersion: 'v2',
      },
    ],
    tags: ['broker', 'equities', 'sandbox'],
  }),
  connector({
    id: 'CN-IBKR',
    slug: 'interactive-brokers',
    name: 'Interactive Brokers',
    provider: 'Interactive Brokers',
    description:
      'Multi-asset broker connector abstraction — accounts, positions and governed order routing.',
    type: 'BROKER',
    status: 'MAINTENANCE',
    environment: 'SANDBOX',
    owner: 'EXE',
    team: 'Execution',
    version: '0.8.0',
    registeredAt: '2026-05-01T00:00:00.000Z',
    enabledAt: '2026-05-06T00:00:00.000Z',
    updatedAt: '2026-07-31T00:00:00.000Z',
    health: {
      status: 'DEGRADED',
      message: 'Gateway session unstable during maintenance window.',
      latency: '320ms',
      uptime: '98.10%',
      lastCheckedAt: '2026-08-01T00:00:00.000Z',
    },
    capabilities: [
      { key: 'accounts', label: 'Accounts', support: 'SUPPORTED' },
      { key: 'positions', label: 'Positions', support: 'PARTIAL' },
      {
        key: 'order-entry',
        label: 'Order entry',
        support: 'UNSUPPORTED',
        note: 'Disabled during maintenance.',
      },
    ],
    metrics: {
      requestsToDate: '640K',
      errorRate: '1.2%',
      avgLatency: '320ms',
      rateLimit: '50/min',
      lastRequestAt: '2026-07-31T00:00:00.000Z',
    },
    diagnostics: [
      { check: 'Gateway session', status: 'WARN', detail: 'Frequent re-auth during maintenance.' },
      { check: 'Execution guardrail', status: 'PASS', detail: 'Live routing disabled.' },
    ],
    validation: {
      status: 'PENDING',
      checkedAt: '2026-07-31T00:00:00.000Z',
      issues: [
        {
          code: 'HLT-002',
          severity: 'WARNING',
          message: 'Degraded health during maintenance; re-validate before enable.',
        },
      ],
    },
    activity: [
      {
        id: 'e1',
        label: 'Entered maintenance window',
        actor: 'EXE',
        occurredAt: '2026-07-31T00:00:00.000Z',
      },
    ],
    versions: [
      {
        version: '0.8.0',
        releasedAt: '2026-05-01T00:00:00.000Z',
        note: 'Gateway abstraction (sandbox).',
      },
    ],
    tags: ['broker', 'multi-asset', 'maintenance'],
  }),
  connector({
    id: 'CN-BIST',
    slug: 'bist',
    name: 'Borsa İstanbul (BIST)',
    provider: 'Borsa İstanbul',
    description: 'Turkish equities exchange market data connector abstraction.',
    type: 'EXCHANGE',
    owner: 'MKT',
    team: 'Market Data',
    status: 'DISABLED',
    version: '0.5.0',
    registeredAt: '2026-04-20T00:00:00.000Z',
    enabledAt: '2026-04-25T00:00:00.000Z',
    updatedAt: '2026-07-10T00:00:00.000Z',
    retiredAt: '2026-07-10T00:00:00.000Z',
    health: {
      status: 'UNKNOWN',
      message: 'Disabled by operator.',
      latency: '—',
      uptime: '—',
      lastCheckedAt: '2026-07-10T00:00:00.000Z',
    },
    capabilities: [
      { key: 'market-data', label: 'Market data', support: 'SUPPORTED' },
      { key: 'reference', label: 'Reference data', support: 'PARTIAL' },
      { key: 'streaming', label: 'Streaming', support: 'PLANNED' },
    ],
    diagnostics: [
      { check: 'Endpoint reachability', status: 'SKIPPED', detail: 'Connector disabled.' },
    ],
    validation: PASSED('2026-06-30T00:00:00.000Z'),
    activity: [
      {
        id: 'e1',
        label: 'Disabled pending vendor agreement',
        actor: 'MKT',
        occurredAt: '2026-07-10T00:00:00.000Z',
      },
    ],
    versions: [
      {
        version: '0.5.0',
        releasedAt: '2026-04-20T00:00:00.000Z',
        note: 'Initial EOD abstraction.',
      },
    ],
    tags: ['equities', 'turkey', 'exchange', 'disabled'],
  }),
  connector({
    id: 'CN-FINNHUB',
    slug: 'finnhub',
    name: 'Finnhub',
    provider: 'Finnhub',
    description: 'Market data and company fundamentals provider connector abstraction.',
    type: 'MARKET_DATA',
    status: 'ENABLED',
    owner: 'MKT',
    team: 'Market Data',
    version: '1.0.0',
    registeredAt: '2026-03-01T00:00:00.000Z',
    enabledAt: '2026-03-03T00:00:00.000Z',
    updatedAt: '2026-07-27T00:00:00.000Z',
    health: HEALTHY('2026-08-02T00:00:00.000Z', '130ms', '99.70%'),
    capabilities: [
      { key: 'historical', label: 'Historical candles', support: 'SUPPORTED' },
      { key: 'reference', label: 'Fundamentals', support: 'SUPPORTED' },
      { key: 'snapshot', label: 'Quotes', support: 'SUPPORTED' },
    ],
    metrics: {
      requestsToDate: '9.7M',
      errorRate: '0.10%',
      avgLatency: '130ms',
      rateLimit: '60/min',
      lastRequestAt: '2026-08-02T00:00:00.000Z',
    },
    diagnostics: [
      { check: 'Endpoint reachability', status: 'PASS', detail: 'Reference endpoint resolvable.' },
    ],
    validation: PASSED('2026-07-20T00:00:00.000Z'),
    activity: [
      {
        id: 'e1',
        label: 'Fundamentals coverage expanded',
        actor: 'MKT',
        occurredAt: '2026-07-27T00:00:00.000Z',
      },
    ],
    versions: [
      {
        version: '1.0.0',
        releasedAt: '2026-03-01T00:00:00.000Z',
        note: 'Initial registration.',
        apiVersion: 'v1',
      },
    ],
    tags: ['equities', 'fundamentals', 'market-data'],
  }),
  connector({
    id: 'CN-TIINGO',
    slug: 'tiingo',
    name: 'Tiingo',
    provider: 'Tiingo',
    description: 'EOD prices and news provider connector abstraction.',
    type: 'MARKET_DATA',
    status: 'ENABLED',
    owner: 'MKT',
    team: 'Market Data',
    version: '1.0.0',
    registeredAt: '2026-03-01T00:00:00.000Z',
    enabledAt: '2026-03-03T00:00:00.000Z',
    updatedAt: '2026-07-18T00:00:00.000Z',
    health: HEALTHY('2026-08-02T00:00:00.000Z', '160ms', '99.60%'),
    capabilities: [
      { key: 'historical', label: 'EOD prices', support: 'SUPPORTED' },
      { key: 'reference', label: 'Metadata', support: 'SUPPORTED' },
      { key: 'snapshot', label: 'Intraday', support: 'PARTIAL' },
    ],
    metrics: {
      requestsToDate: '3.3M',
      errorRate: '0.06%',
      avgLatency: '160ms',
      rateLimit: '500/hr',
      lastRequestAt: '2026-08-01T00:00:00.000Z',
    },
    diagnostics: [
      { check: 'Endpoint reachability', status: 'PASS', detail: 'Reference endpoint resolvable.' },
    ],
    validation: PASSED('2026-07-15T00:00:00.000Z'),
    activity: [
      {
        id: 'e1',
        label: 'Health check passed',
        actor: 'monitoring',
        occurredAt: '2026-08-01T00:00:00.000Z',
      },
    ],
    versions: [
      {
        version: '1.0.0',
        releasedAt: '2026-03-01T00:00:00.000Z',
        note: 'Initial registration.',
        apiVersion: 'v1',
      },
    ],
    tags: ['equities', 'eod', 'market-data'],
  }),
  connector({
    id: 'CN-ALPHAVANTAGE',
    slug: 'alpha-vantage',
    name: 'Alpha Vantage',
    provider: 'Alpha Vantage',
    description: 'Market data and technical indicators provider connector abstraction.',
    type: 'MARKET_DATA',
    status: 'DEPRECATED',
    owner: 'MKT',
    team: 'Market Data',
    version: '0.9.0',
    registeredAt: '2026-02-10T00:00:00.000Z',
    enabledAt: '2026-02-12T00:00:00.000Z',
    updatedAt: '2026-06-15T00:00:00.000Z',
    retiredAt: '2026-06-15T00:00:00.000Z',
    health: {
      status: 'DEGRADED',
      message: 'Deprecated; superseded by Polygon and Finnhub.',
      latency: '450ms',
      uptime: '97.00%',
      lastCheckedAt: '2026-06-15T00:00:00.000Z',
    },
    capabilities: [
      { key: 'historical', label: 'Historical', support: 'SUPPORTED' },
      { key: 'snapshot', label: 'Quotes', support: 'PARTIAL' },
      { key: 'reference', label: 'Indicators', support: 'SUPPORTED' },
    ],
    metrics: {
      requestsToDate: '2.1M',
      errorRate: '0.9%',
      avgLatency: '450ms',
      rateLimit: '5/min',
      lastRequestAt: '2026-06-14T00:00:00.000Z',
    },
    diagnostics: [
      { check: 'Rate-limit headroom', status: 'WARN', detail: 'Very low free-tier limit.' },
    ],
    validation: PASSED('2026-06-01T00:00:00.000Z'),
    activity: [
      {
        id: 'e1',
        label: 'Marked deprecated',
        actor: 'MKT',
        occurredAt: '2026-06-15T00:00:00.000Z',
      },
    ],
    versions: [
      {
        version: '0.9.0',
        releasedAt: '2026-02-10T00:00:00.000Z',
        note: 'Initial registration.',
        apiVersion: 'v1',
      },
    ],
    tags: ['equities', 'deprecated', 'market-data'],
  }),
  connector({
    id: 'CN-FRED',
    slug: 'fred',
    name: 'Federal Reserve (FRED)',
    provider: 'Federal Reserve Bank of St. Louis',
    description: 'Macroeconomic time-series provider connector abstraction.',
    type: 'MACRO_DATA',
    status: 'ENABLED',
    owner: 'RES',
    team: 'Research Data',
    version: '1.0.0',
    registeredAt: '2026-02-05T00:00:00.000Z',
    enabledAt: '2026-02-06T00:00:00.000Z',
    updatedAt: '2026-07-22T00:00:00.000Z',
    health: HEALTHY('2026-08-02T00:00:00.000Z', '140ms', '99.90%'),
    capabilities: [
      { key: 'series', label: 'Series', support: 'SUPPORTED' },
      { key: 'releases', label: 'Releases', support: 'SUPPORTED' },
      {
        key: 'revisions',
        label: 'Vintages/revisions',
        support: 'SUPPORTED',
        note: 'Point-in-time vintages preserved.',
      },
    ],
    metrics: {
      requestsToDate: '780K',
      errorRate: '0.03%',
      avgLatency: '140ms',
      rateLimit: '120/min',
      lastRequestAt: '2026-08-01T00:00:00.000Z',
    },
    diagnostics: [
      { check: 'Endpoint reachability', status: 'PASS', detail: 'Reference endpoint resolvable.' },
    ],
    validation: PASSED('2026-07-20T00:00:00.000Z'),
    credentials: [{ kind: 'API key', status: 'NOT_REQUIRED', secretRef: '—' }],
    configFields: [
      { key: 'base-url', label: 'Base URL', value: 'ref:endpoints/fred', secret: false },
      { key: 'vintage-mode', label: 'Vintage mode', value: 'as-of', secret: false },
    ],
    activity: [
      {
        id: 'e1',
        label: 'Vintage backfill completed',
        actor: 'RES',
        occurredAt: '2026-07-22T00:00:00.000Z',
      },
    ],
    versions: [
      {
        version: '1.0.0',
        releasedAt: '2026-02-05T00:00:00.000Z',
        note: 'Initial registration.',
        apiVersion: 'v1',
      },
    ],
    tags: ['macro', 'economic', 'point-in-time'],
  }),
  connector({
    id: 'CN-SECEDGAR',
    slug: 'sec-edgar',
    name: 'SEC EDGAR',
    provider: 'U.S. Securities and Exchange Commission',
    description: 'Regulatory filings provider connector abstraction.',
    type: 'ALT_DATA',
    status: 'ENABLED',
    owner: 'RES',
    team: 'Research Data',
    version: '1.0.0',
    registeredAt: '2026-02-15T00:00:00.000Z',
    enabledAt: '2026-02-16T00:00:00.000Z',
    updatedAt: '2026-07-19T00:00:00.000Z',
    health: HEALTHY('2026-08-02T00:00:00.000Z', '210ms', '99.50%'),
    capabilities: [
      { key: 'datasets', label: 'Filings', support: 'SUPPORTED' },
      { key: 'search', label: 'Full-text search', support: 'SUPPORTED' },
      { key: 'bulk', label: 'Bulk download', support: 'PARTIAL' },
    ],
    metrics: {
      requestsToDate: '540K',
      errorRate: '0.04%',
      avgLatency: '210ms',
      rateLimit: '10/sec',
      lastRequestAt: '2026-08-01T00:00:00.000Z',
    },
    diagnostics: [
      { check: 'Fair-access headers', status: 'PASS', detail: 'User-agent policy respected.' },
    ],
    validation: PASSED('2026-07-15T00:00:00.000Z'),
    credentials: [{ kind: 'None', status: 'NOT_REQUIRED', secretRef: '—' }],
    configFields: [
      { key: 'base-url', label: 'Base URL', value: 'ref:endpoints/sec-edgar', secret: false },
      {
        key: 'user-agent',
        label: 'User-Agent',
        value: 'ref:policy/sec-fair-access',
        secret: false,
      },
    ],
    activity: [
      {
        id: 'e1',
        label: 'Full-text search enabled',
        actor: 'RES',
        occurredAt: '2026-07-19T00:00:00.000Z',
      },
    ],
    versions: [
      { version: '1.0.0', releasedAt: '2026-02-15T00:00:00.000Z', note: 'Initial registration.' },
    ],
    tags: ['filings', 'regulatory', 'alt-data'],
  }),
  connector({
    id: 'CN-OPENAI',
    slug: 'openai',
    name: 'OpenAI',
    provider: 'OpenAI',
    description:
      'AI provider connector abstraction — bound via the Model Registry (metadata only; no inference here).',
    type: 'AI_PROVIDER',
    status: 'ENABLED',
    owner: 'HAI',
    team: 'AI Governance',
    version: '1.0.0',
    registeredAt: '2026-03-10T00:00:00.000Z',
    enabledAt: '2026-03-11T00:00:00.000Z',
    updatedAt: '2026-07-28T00:00:00.000Z',
    health: HEALTHY('2026-08-02T00:00:00.000Z', '640ms', '99.80%'),
    capabilities: [
      { key: 'completion', label: 'Completion', support: 'SUPPORTED' },
      { key: 'embedding', label: 'Embeddings', support: 'SUPPORTED' },
      { key: 'tool-use', label: 'Tool use', support: 'SUPPORTED' },
    ],
    metrics: {
      requestsToDate: '410K',
      errorRate: '0.20%',
      avgLatency: '640ms',
      rateLimit: '3500/min',
      lastRequestAt: '2026-08-01T00:00:00.000Z',
    },
    diagnostics: [
      {
        check: 'Model binding pinned',
        status: 'PASS',
        detail: 'Models pinned in registry (AI-6).',
      },
    ],
    validation: PASSED('2026-07-25T00:00:00.000Z'),
    activity: [
      {
        id: 'e1',
        label: 'Model bindings re-pinned',
        actor: 'HAI',
        occurredAt: '2026-07-28T00:00:00.000Z',
      },
    ],
    versions: [
      {
        version: '1.0.0',
        releasedAt: '2026-03-10T00:00:00.000Z',
        note: 'Initial registration.',
        apiVersion: 'v1',
      },
    ],
    tags: ['ai', 'llm', 'provider'],
  }),
  connector({
    id: 'CN-ANTHROPIC',
    slug: 'anthropic',
    name: 'Anthropic',
    provider: 'Anthropic',
    description:
      'AI provider connector abstraction — bound via the Model Registry (metadata only; no inference here).',
    type: 'AI_PROVIDER',
    status: 'ENABLED',
    owner: 'HAI',
    team: 'AI Governance',
    version: '1.1.0',
    registeredAt: '2026-03-10T00:00:00.000Z',
    enabledAt: '2026-03-11T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    health: HEALTHY('2026-08-02T00:00:00.000Z', '590ms', '99.90%'),
    capabilities: [
      { key: 'completion', label: 'Messages', support: 'SUPPORTED' },
      { key: 'tool-use', label: 'Tool use', support: 'SUPPORTED' },
      { key: 'embedding', label: 'Embeddings', support: 'UNSUPPORTED' },
    ],
    metrics: {
      requestsToDate: '380K',
      errorRate: '0.15%',
      avgLatency: '590ms',
      rateLimit: '4000/min',
      lastRequestAt: '2026-08-02T00:00:00.000Z',
    },
    diagnostics: [
      {
        check: 'Model binding pinned',
        status: 'PASS',
        detail: 'Models pinned in registry (AI-6).',
      },
    ],
    validation: PASSED('2026-07-30T00:00:00.000Z'),
    activity: [
      {
        id: 'e1',
        label: 'Added Opus 4.8 binding (pinned)',
        actor: 'HAI',
        occurredAt: '2026-08-01T00:00:00.000Z',
      },
    ],
    versions: [
      {
        version: '1.1.0',
        releasedAt: '2026-07-20T00:00:00.000Z',
        note: 'Model roster refreshed.',
        apiVersion: 'v1',
      },
    ],
    tags: ['ai', 'llm', 'provider'],
  }),
  connector({
    id: 'CN-GEMINI',
    slug: 'google-gemini',
    name: 'Google Gemini',
    provider: 'Google',
    description:
      'AI provider connector abstraction — bound via the Model Registry (metadata only; no inference here).',
    type: 'AI_PROVIDER',
    status: 'REGISTERED',
    owner: 'HAI',
    team: 'AI Governance',
    version: '0.2.0',
    registeredAt: '2026-07-25T00:00:00.000Z',
    updatedAt: '2026-07-29T00:00:00.000Z',
    health: {
      status: 'UNKNOWN',
      message: 'Registered; evaluation pending before enable.',
      latency: '—',
      uptime: '—',
      lastCheckedAt: '2026-07-29T00:00:00.000Z',
    },
    capabilities: [
      { key: 'completion', label: 'Completion', support: 'PLANNED' },
      { key: 'embedding', label: 'Embeddings', support: 'PLANNED' },
      { key: 'tool-use', label: 'Tool use', support: 'PLANNED' },
    ],
    validation: { status: 'NOT_RUN', issues: [] },
    diagnostics: [
      {
        check: 'Model binding pinned',
        status: 'SKIPPED',
        detail: 'Pending model registry binding.',
      },
    ],
    credentials: [
      { kind: 'API key', status: 'MISSING', secretRef: 'vault://connectors/google-gemini/api-key' },
    ],
    activity: [
      {
        id: 'e1',
        label: 'Registered in connector registry',
        actor: 'HAI',
        occurredAt: '2026-07-25T00:00:00.000Z',
      },
    ],
    versions: [
      {
        version: '0.2.0',
        releasedAt: '2026-07-25T00:00:00.000Z',
        note: 'Registered; abstraction only.',
      },
    ],
    tags: ['ai', 'llm', 'provider', 'evaluation'],
  }),
];

export interface MockRepositoryOptions {
  latencyMs?: number;
}

export class MockConnectorRepository implements ConnectorRepository {
  private readonly data: readonly ConnectorDto[];
  private readonly latencyMs: number;

  constructor(seed: readonly ConnectorDto[] = SEED, options: MockRepositoryOptions = {}) {
    this.data = seed;
    this.latencyMs = options.latencyMs ?? 0;
  }

  async list(query: ConnectorQuery): Promise<readonly ConnectorDto[]> {
    await this.delay();
    return applyConnectorQuery(this.data, query);
  }

  async getById(id: string): Promise<ConnectorDto | null> {
    await this.delay();
    return this.data.find((connector) => connector.id === id) ?? null;
  }

  private async delay(): Promise<void> {
    if (this.latencyMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.latencyMs));
    }
  }
}

export const CONNECTOR_SEED = SEED;
