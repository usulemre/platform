/**
 * Gateway metrics & connectivity — deterministic aggregation over a set of brokers (status/provider
 * distribution, connected/healthy rates, average latency and health score, capability coverage) and
 * the per-broker connectivity monitor rows. Pure: no IO. Powers the Gateway Metrics and Connectivity
 * Monitor views.
 */
import {
  BROKER_STATUSES,
  CAPABILITY_TYPES,
  type Broker,
  type BrokerCapabilityType,
  type BrokerMetrics,
  type BrokerStatus,
  type HealthLevel,
  type ProviderId,
} from '@platform/broker-sdk';

export function computeBrokerMetrics(brokers: readonly Broker[]): BrokerMetrics {
  const total = brokers.length;
  const statusCounts = new Map<BrokerStatus, number>();
  const providerCounts = new Map<ProviderId, number>();
  const capabilityCounts = new Map<BrokerCapabilityType, number>();
  let latencySum = 0;
  let latencyN = 0;
  let healthSum = 0;
  let reconnects = 0;
  for (const broker of brokers) {
    statusCounts.set(broker.status, (statusCounts.get(broker.status) ?? 0) + 1);
    providerCounts.set(broker.providerId, (providerCounts.get(broker.providerId) ?? 0) + 1);
    for (const cap of broker.capabilities)
      if (cap.enabled) capabilityCounts.set(cap.type, (capabilityCounts.get(cap.type) ?? 0) + 1);
    if (broker.connection.latencyMs > 0) {
      latencySum += broker.connection.latencyMs;
      latencyN += 1;
    }
    healthSum += broker.health.score;
    reconnects += broker.reconnectAttempts;
  }
  const connected = brokers.filter(
    (b) => b.status === 'CONNECTED' || b.status === 'HEALTHY' || b.status === 'DEGRADED',
  ).length;
  const healthy = statusCounts.get('HEALTHY') ?? 0;
  return {
    total,
    registered: statusCounts.get('REGISTERED') ?? 0,
    connected,
    healthy,
    degraded: statusCounts.get('DEGRADED') ?? 0,
    disconnected: statusCounts.get('DISCONNECTED') ?? 0,
    archived: statusCounts.get('ARCHIVED') ?? 0,
    connectedRate: total > 0 ? connected / total : 0,
    healthyRate: total > 0 ? healthy / total : 0,
    averageLatencyMs: latencyN > 0 ? latencySum / latencyN : 0,
    averageHealthScore: total > 0 ? healthSum / total : 0,
    totalReconnects: reconnects,
    byStatus: BROKER_STATUSES.map((status) => ({
      status,
      count: statusCounts.get(status) ?? 0,
    })).filter((b) => b.count > 0),
    byProvider: [...providerCounts.entries()]
      .map(([providerId, count]) => ({ providerId, count }))
      .sort((a, b) => b.count - a.count),
    capabilityCoverage: CAPABILITY_TYPES.map((type) => ({
      type,
      count: capabilityCounts.get(type) ?? 0,
    })),
  };
}

export interface ConnectivityRow {
  readonly brokerId: string;
  readonly name: string;
  readonly providerId: ProviderId;
  readonly status: BrokerStatus;
  readonly level: HealthLevel;
  readonly score: number;
  readonly latencyMs: number;
  readonly errorRate: number;
  readonly reconnectAttempts: number;
  readonly lastHeartbeatAt?: string;
}

export function computeConnectivity(brokers: readonly Broker[]): readonly ConnectivityRow[] {
  return brokers
    .map((b) => ({
      brokerId: b.id,
      name: b.name,
      providerId: b.providerId,
      status: b.status,
      level: b.health.level,
      score: b.health.score,
      latencyMs: b.connection.latencyMs,
      errorRate: b.health.errorRate,
      reconnectAttempts: b.reconnectAttempts,
      lastHeartbeatAt: b.connection.lastHeartbeatAt,
    }))
    .sort((a, b) => a.score - b.score);
}
