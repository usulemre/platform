/**
 * Broker Gateway application service — the ONLY layer the UI/hooks call. It reads brokers from the
 * repository, runs the REAL `@platform/broker-sdk` rules (health, capability matrix, provider catalog)
 * plus local roll-ups (metrics, connectivity, sessions), and maps everything to view models. No
 * infrastructure, no exchange/broker SDK, no connectivity, no persistence.
 */
import {
  BROKER_STATUSES,
  CAPABILITY_CATALOG,
  PROVIDER_CATALOG,
  type Broker,
  type BrokerStatus,
  type ProviderId,
} from '@platform/broker-sdk';
import { fmtMs, fmtPct, fmtScore, statusTone, title, type Tone } from '../domain/format';
import type { BrokerQuery } from '../domain/query';
import {
  toAccount,
  toAuditRow,
  toBalanceSync,
  toBrokerRow,
  toConnectionRow,
  toConnectivityRow,
  toDetail,
  toHealthRow,
  toOrderSync,
  toPositionSync,
  toSessionRow,
} from '../domain/mappers';
import type {
  AccountVm,
  AuditRowVm,
  BalanceSyncVm,
  BrokerDetailVm,
  BrokerRef,
  BrokerRowVm,
  CapabilityRowVm,
  ConnectionRowVm,
  ConnectivityRowVm,
  GatewaySessionVm,
  HealthRowVm,
  MetricsVm,
  OrderSyncVm,
  PositionSyncVm,
  ProviderRowVm,
  SessionRowVm,
  SummaryVm,
} from '../domain/view-model';
import type { GatewayRepository } from '../data/repository';

const STARTED_AT = '2026-08-05T13:00:00.000Z';

function isConnected(status: BrokerStatus): boolean {
  return status === 'CONNECTED' || status === 'HEALTHY' || status === 'DEGRADED';
}

export class GatewayViewService {
  constructor(private readonly repository: GatewayRepository) {}

  async listBrokers(query: BrokerQuery = {}): Promise<BrokerRowVm[]> {
    return (await this.repository.listBrokers(query)).map(toBrokerRow);
  }
  async listRefs(): Promise<BrokerRef[]> {
    return (await this.repository.listAll()).map((b) => ({
      id: b.id,
      name: b.name,
      status: { label: title(b.status), tone: statusTone(b.status) },
    }));
  }
  async getDetail(id: string): Promise<BrokerDetailVm | null> {
    const broker = await this.repository.getBroker(id);
    return broker ? toDetail(broker) : null;
  }

  async getSummary(): Promise<SummaryVm> {
    const brokers = await this.repository.listAll();
    return this.summaryOf(brokers);
  }

  private summaryOf(brokers: readonly Broker[]): SummaryVm {
    const total = brokers.length;
    const connected = brokers.filter((b) => isConnected(b.status)).length;
    const healthy = brokers.filter((b) => b.status === 'HEALTHY').length;
    const degraded = brokers.filter((b) => b.status === 'DEGRADED').length;
    const disconnected = brokers.filter((b) => b.status === 'DISCONNECTED').length;
    const avgScore = total > 0 ? brokers.reduce((s, b) => s + b.health.score, 0) / total : 0;
    const counts = new Map<BrokerStatus, number>();
    for (const b of brokers) counts.set(b.status, (counts.get(b.status) ?? 0) + 1);
    return {
      kpis: [
        { label: 'Brokers', value: String(total) },
        { label: 'Connected', value: String(connected), tone: 'info' },
        { label: 'Healthy', value: String(healthy), tone: 'positive' },
        { label: 'Degraded', value: String(degraded), tone: degraded > 0 ? 'warning' : 'neutral' },
        {
          label: 'Disconnected',
          value: String(disconnected),
          tone: disconnected > 0 ? 'danger' : 'neutral',
        },
        { label: 'Avg health', value: fmtScore(avgScore), tone: 'neutral' },
      ],
      byStatus: BROKER_STATUSES.map((status) => ({
        label: title(status),
        count: counts.get(status) ?? 0,
        tone: statusTone(status),
      })).filter((s) => s.count > 0),
    };
  }

  async connectivity(): Promise<ConnectivityRowVm[]> {
    return (await this.repository.listAll())
      .map(toConnectivityRow)
      .sort((a, b) => parseInt(a.score) - parseInt(b.score));
  }
  async health(): Promise<HealthRowVm[]> {
    return (await this.repository.listAll()).map(toHealthRow);
  }
  async connections(): Promise<ConnectionRowVm[]> {
    return (await this.repository.listAll()).map(toConnectionRow);
  }
  async sessions(): Promise<SessionRowVm[]> {
    return (await this.repository.listAll())
      .map(toSessionRow)
      .filter((s): s is SessionRowVm => s !== null);
  }
  async gatewaySession(): Promise<GatewaySessionVm> {
    const brokers = await this.repository.listAll();
    const connected = brokers.filter((b) => isConnected(b.status)).length;
    const healthy = brokers.filter((b) => b.status === 'HEALTHY').length;
    return {
      id: 'GWSESSION-1',
      startedLabel: STARTED_AT.slice(0, 16).replace('T', ' '),
      configVersion: 1,
      brokerCount: brokers.length,
      connectedCount: connected,
      healthyCount: healthy,
    };
  }

  async accounts(): Promise<AccountVm[]> {
    return (await this.repository.listAll())
      .map(toAccount)
      .filter((a): a is AccountVm => a !== null);
  }
  async positionSync(): Promise<PositionSyncVm[]> {
    return (await this.repository.listAll())
      .map(toPositionSync)
      .filter((s): s is PositionSyncVm => s !== null);
  }
  async balanceSync(): Promise<BalanceSyncVm[]> {
    return (await this.repository.listAll())
      .map(toBalanceSync)
      .filter((s): s is BalanceSyncVm => s !== null);
  }
  async orderSync(): Promise<OrderSyncVm[]> {
    return (await this.repository.listAll())
      .map(toOrderSync)
      .filter((s): s is OrderSyncVm => s !== null);
  }

  async providers(): Promise<ProviderRowVm[]> {
    const brokers = await this.repository.listAll();
    const counts = new Map<ProviderId, number>();
    for (const b of brokers) counts.set(b.providerId, (counts.get(b.providerId) ?? 0) + 1);
    return PROVIDER_CATALOG.map((p) => ({
      id: p.id,
      name: p.name,
      kind: title(p.kind),
      transport: p.transport,
      assetClasses: p.assetClasses.map(title),
      capabilityCount: p.capabilities.length,
      registeredBrokers: counts.get(p.id) ?? 0,
      placeholder: p.placeholder,
    }));
  }

  capabilityMatrix(): CapabilityRowVm[] {
    return CAPABILITY_CATALOG.map((cap) => {
      const providers = PROVIDER_CATALOG.map((p) => ({
        providerId: p.id,
        supported: p.capabilities.includes(cap.type),
      }));
      return {
        capability: cap.type,
        label: cap.label,
        domain: title(cap.domain),
        supportedCount: providers.filter((p) => p.supported).length,
        providers,
      };
    });
  }

  async metrics(): Promise<MetricsVm> {
    const brokers = await this.repository.listAll();
    const total = brokers.length;
    const connected = brokers.filter((b) => isConnected(b.status)).length;
    const healthy = brokers.filter((b) => b.status === 'HEALTHY').length;
    const latencies = brokers
      .filter((b) => b.connection.latencyMs > 0)
      .map((b) => b.connection.latencyMs);
    const avgLatency = latencies.length
      ? latencies.reduce((s, x) => s + x, 0) / latencies.length
      : 0;
    const avgScore = total > 0 ? brokers.reduce((s, b) => s + b.health.score, 0) / total : 0;
    const reconnects = brokers.reduce((s, b) => s + b.reconnectAttempts, 0);
    const statusCounts = new Map<BrokerStatus, number>();
    const providerCounts = new Map<ProviderId, number>();
    const capCounts = new Map<string, number>();
    for (const b of brokers) {
      statusCounts.set(b.status, (statusCounts.get(b.status) ?? 0) + 1);
      providerCounts.set(b.providerId, (providerCounts.get(b.providerId) ?? 0) + 1);
      for (const c of b.capabilities)
        if (c.enabled) capCounts.set(c.type, (capCounts.get(c.type) ?? 0) + 1);
    }
    return {
      kpis: [
        { label: 'Brokers', value: String(total) },
        { label: 'Connected', value: fmtPct(total > 0 ? connected / total : 0), tone: 'info' },
        { label: 'Healthy', value: fmtPct(total > 0 ? healthy / total : 0), tone: 'positive' },
        { label: 'Avg latency', value: fmtMs(avgLatency), tone: 'neutral' as Tone },
        { label: 'Avg health', value: fmtScore(avgScore), tone: 'neutral' },
        { label: 'Reconnects', value: String(reconnects), tone: 'neutral' },
      ],
      byStatus: BROKER_STATUSES.map((status) => ({
        label: title(status),
        count: statusCounts.get(status) ?? 0,
        tone: statusTone(status),
      })).filter((s) => s.count > 0),
      byProvider: [...providerCounts.entries()]
        .map(([providerId, count]) => ({ providerId, count }))
        .sort((a, b) => b.count - a.count),
      capabilityCoverage: CAPABILITY_CATALOG.map((c) => ({
        label: c.label,
        count: capCounts.get(c.type) ?? 0,
      })),
    };
  }

  async audit(): Promise<AuditRowVm[]> {
    const brokers = await this.repository.listAll();
    return brokers
      .flatMap((b) => b.audit.map((entry) => toAuditRow(b, entry)))
      .sort((a, b) => b.atLabel.localeCompare(a.atLabel));
  }
}
