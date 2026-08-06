/**
 * Broker Gateway mappers — convert the REAL `@platform/broker-sdk` domain objects (and the local
 * roll-ups) into pre-formatted view models. Pure functions; all formatting flows through `./format`.
 */
import {
  describeAction,
  permittedActions,
  type Broker,
  type BrokerAccount,
  type BrokerEvent,
  type BrokerHealth,
  type HealthLevel,
} from '@platform/broker-sdk';
import {
  envTone,
  fmtMoney,
  fmtMs,
  fmtNumber,
  fmtPct,
  fmtScore,
  healthTone,
  shortTime,
  statusTone,
  title,
  type Tone,
} from './format';
import type {
  AccountVm,
  AuditRowVm,
  BalanceRowVm,
  BalanceSyncVm,
  BrokerDetailVm,
  BrokerRowVm,
  Chip,
  ConnectionRowVm,
  ConnectivityRowVm,
  EventVm,
  HealthCheckVm,
  HealthRowVm,
  OrderRowVm,
  OrderSyncVm,
  PositionRowVm,
  PositionSyncVm,
  SessionRowVm,
} from './view-model';

export function statusChip(status: Broker['status']): Chip {
  return { label: title(status), tone: statusTone(status) };
}
export function healthChip(level: HealthLevel): Chip {
  return { label: title(level), tone: healthTone(level) };
}
function levelChip(level: HealthLevel): Chip {
  return { label: title(level), tone: healthTone(level) };
}

export function toBrokerRow(b: Broker): BrokerRowVm {
  return {
    id: b.id,
    name: b.name,
    provider: b.providerName,
    kind: title(b.kind),
    transport: b.transport,
    environment: { label: b.environment, tone: envTone(b.environment) },
    region: b.region,
    status: statusChip(b.status),
    health: healthChip(b.health.level),
    score: fmtScore(b.health.score),
    latency: b.connection.latencyMs > 0 ? fmtMs(b.connection.latencyMs) : '—',
    updatedLabel: shortTime(b.updatedAt),
  };
}

export function toConnectivityRow(b: Broker): ConnectivityRowVm {
  return {
    brokerId: b.id,
    name: b.name,
    provider: b.providerName,
    status: statusChip(b.status),
    health: healthChip(b.health.level),
    score: fmtScore(b.health.score),
    latency: b.connection.latencyMs > 0 ? fmtMs(b.connection.latencyMs) : '—',
    errorRate: fmtPct(b.health.errorRate, 2),
    reconnects: b.reconnectAttempts,
    lastHeartbeatLabel: shortTime(b.connection.lastHeartbeatAt),
  };
}

function toHealthChecks(health: BrokerHealth): readonly HealthCheckVm[] {
  return health.checks.map((c) => ({
    id: c.id,
    label: c.label,
    level: levelChip(c.level),
    detail: c.detail,
  }));
}

export function toHealthRow(b: Broker): HealthRowVm {
  return {
    brokerId: b.id,
    name: b.name,
    health: healthChip(b.health.level),
    score: fmtScore(b.health.score),
    checks: toHealthChecks(b.health),
  };
}

export function toConnectionRow(b: Broker): ConnectionRowVm {
  return {
    brokerId: b.id,
    name: b.name,
    transport: b.transport,
    status: statusChip(b.status),
    endpointRef: b.connection.endpointRef,
    latency: b.connection.latencyMs > 0 ? fmtMs(b.connection.latencyMs) : '—',
    reconnects: b.reconnectAttempts,
    connectedLabel: shortTime(b.connection.connectedAt),
    lastHeartbeatLabel: shortTime(b.connection.lastHeartbeatAt),
    actions: permittedActions(b.status).map((a) => ({
      label: describeAction(a).label,
      tone: 'info' as Tone,
    })),
  };
}

const SESSION_TONE: Record<string, Tone> = {
  OPEN: 'positive',
  EXPIRED: 'warning',
  CLOSED: 'neutral',
};

export function toSessionRow(b: Broker): SessionRowVm | null {
  if (!b.session) return null;
  const s = b.session;
  return {
    id: s.id,
    brokerName: b.name,
    provider: b.providerName,
    state: { label: title(s.state), tone: SESSION_TONE[s.state] ?? 'neutral' },
    tokenRef: s.tokenRef,
    openedLabel: shortTime(s.openedAt),
    expiresLabel: shortTime(s.expiresAt),
    lastActivityLabel: shortTime(s.lastActivityAt),
  };
}

function positionRows(account: BrokerAccount): readonly PositionRowVm[] {
  return account.positions.map((p) => ({
    symbol: p.symbol,
    quantity: fmtNumber(p.quantity),
    averagePrice: p.averagePrice.toLocaleString('en-US'),
    assetClass: title(p.assetClass),
    side:
      p.quantity >= 0
        ? { label: 'LONG', tone: 'info' as Tone }
        : { label: 'SHORT', tone: 'neutral' as Tone },
  }));
}
function balanceRows(account: BrokerAccount): readonly BalanceRowVm[] {
  return account.balances.map((b) => ({
    currency: b.currency,
    total: fmtNumber(b.total),
    available: fmtNumber(b.available),
  }));
}
function orderRows(account: BrokerAccount): readonly OrderRowVm[] {
  return account.orders.map((o) => ({
    brokerOrderId: o.brokerOrderId,
    clientOrderId: o.clientOrderId,
    symbol: o.symbol,
    status: title(o.status),
    filled: fmtNumber(o.filledQuantity),
    remaining: fmtNumber(o.remainingQuantity),
  }));
}

export function toAccount(b: Broker): AccountVm | null {
  const a = b.account;
  if (!a) return null;
  let gross = 0;
  for (const p of a.positions) gross += Math.abs(p.quantity * p.averagePrice);
  let totalBalance = 0;
  const baseBal = a.balances.find((x) => x.currency === a.baseCurrency);
  totalBalance = baseBal ? baseBal.total : (a.balances[0]?.total ?? 0);
  const open = a.orders.filter(
    (o) => !['FILLED', 'CANCELLED', 'REJECTED', 'EXPIRED'].includes(o.status.toUpperCase()),
  ).length;
  return {
    brokerId: b.id,
    brokerName: b.name,
    accountRef: a.accountRef,
    type: title(a.type),
    baseCurrency: a.baseCurrency,
    positionsCount: a.positions.length,
    grossExposure: fmtMoney(gross, a.baseCurrency),
    totalBalance: fmtMoney(totalBalance, a.baseCurrency),
    openOrders: open,
    syncedLabel: shortTime(a.syncedAt),
    positions: positionRows(a),
    balances: balanceRows(a),
    orders: orderRows(a),
  };
}

export function toPositionSync(b: Broker): PositionSyncVm | null {
  const a = b.account;
  if (!a) return null;
  let longCount = 0;
  let shortCount = 0;
  let gross = 0;
  let net = 0;
  for (const p of a.positions) {
    const value = p.quantity * p.averagePrice;
    gross += Math.abs(value);
    net += value;
    if (p.quantity > 0) longCount += 1;
    else if (p.quantity < 0) shortCount += 1;
  }
  return {
    brokerId: b.id,
    brokerName: b.name,
    accountRef: a.accountRef,
    longCount,
    shortCount,
    grossExposure: fmtMoney(gross, a.baseCurrency),
    netExposure: fmtMoney(net, a.baseCurrency),
    syncedLabel: shortTime(a.syncedAt),
    positions: positionRows(a),
  };
}

export function toBalanceSync(b: Broker): BalanceSyncVm | null {
  const a = b.account;
  if (!a) return null;
  let total = 0;
  let available = 0;
  for (const x of a.balances) {
    total += x.total;
    available += x.available;
  }
  return {
    brokerId: b.id,
    brokerName: b.name,
    accountRef: a.accountRef,
    totalValue: fmtNumber(total),
    availableValue: fmtNumber(available),
    currencies: a.balances.length,
    syncedLabel: shortTime(a.syncedAt),
    balances: balanceRows(a),
  };
}

const OPEN_ORDER = new Set(['NEW', 'PARTIALLY_FILLED', 'ACCEPTED', 'WORKING', 'PENDING']);
export function toOrderSync(b: Broker): OrderSyncVm | null {
  const a = b.account;
  if (!a) return null;
  const open = a.orders.filter((o) => OPEN_ORDER.has(o.status.toUpperCase())).length;
  const filled = a.orders.filter((o) => o.status.toUpperCase() === 'FILLED').length;
  return {
    brokerId: b.id,
    brokerName: b.name,
    accountRef: a.accountRef,
    total: a.orders.length,
    open,
    filled,
    syncedLabel: shortTime(a.syncedAt),
    orders: orderRows(a),
  };
}

const EVENT_TONE: Record<string, Tone> = {
  HEALTHY: 'positive',
  CONNECTED: 'info',
  DEGRADED: 'warning',
  DISCONNECTED: 'danger',
  FAILED_OVER: 'danger',
  ARCHIVED: 'neutral',
  RECOVERED: 'positive',
  RECONNECTED: 'info',
};

export function toEvent(e: BrokerEvent): EventVm {
  return {
    id: e.id,
    type: title(e.type),
    status: e.status ? statusChip(e.status) : undefined,
    message: e.message,
    actor: e.actor,
    atLabel: shortTime(e.at),
    tone: EVENT_TONE[e.type] ?? 'neutral',
  };
}

export function toAuditRow(b: Broker, entry: Broker['audit'][number]): AuditRowVm {
  return {
    id: entry.id,
    brokerId: b.id,
    brokerName: b.name,
    actor: entry.actor,
    action: title(entry.action),
    detail: entry.detail,
    atLabel: shortTime(entry.at),
  };
}

export function toDetail(b: Broker): BrokerDetailVm {
  const connection = toConnectionRow(b);
  const account = toAccount(b);
  const session = toSessionRow(b);
  return {
    id: b.id,
    name: b.name,
    provider: b.providerName,
    kind: title(b.kind),
    transport: b.transport,
    environment: { label: b.environment, tone: envTone(b.environment) },
    region: b.region,
    status: statusChip(b.status),
    health: healthChip(b.health.level),
    kpis: [
      {
        label: 'Health',
        value: `${fmtScore(b.health.score)} (${title(b.health.level)})`,
        tone: healthTone(b.health.level),
      },
      { label: 'Latency', value: connection.latency, tone: 'neutral' },
      { label: 'Reconnects', value: String(b.reconnectAttempts), tone: 'neutral' },
      {
        label: 'Capabilities',
        value: String(b.capabilities.filter((c) => c.enabled).length),
        tone: 'neutral',
      },
    ],
    meta: [
      { label: 'Provider', value: b.providerName },
      { label: 'Kind', value: title(b.kind) },
      { label: 'Transport', value: b.transport },
      { label: 'Environment', value: b.environment },
      { label: 'Region', value: b.region },
      { label: 'Endpoint', value: b.connection.endpointRef },
      { label: 'Credential', value: b.configuration.credentialRef },
      { label: 'Asset classes', value: b.assetClasses.map(title).join(', ') },
      ...(b.failoverBrokerId ? [{ label: 'Failover to', value: b.failoverBrokerId }] : []),
    ],
    capabilities: b.capabilities.map((c) => ({
      type: c.type,
      label: title(c.type),
      enabled: c.enabled,
    })),
    checks: toHealthChecks(b.health),
    permittedActions: permittedActions(b.status).map((a) => ({
      label: describeAction(a).label,
      tone: 'info' as Tone,
    })),
    connection,
    session: session ?? undefined,
    account: account ?? undefined,
    events: [...b.events].reverse().map(toEvent),
    failoverBrokerId: b.failoverBrokerId,
  };
}
