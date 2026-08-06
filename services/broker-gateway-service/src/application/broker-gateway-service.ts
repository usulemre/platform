/**
 * Broker-gateway application service — the orchestration surface of the canonical Broker Gateway. It
 * is the ONLY component that owns broker connectivity, and it does so exclusively through the provider
 * capability contract (the injected `BrokerProviderPort`), isolating the rest of the platform from
 * provider specifics. It registers brokers, drives the REAL lifecycle state machine (register →
 * configure → authenticate → connect → health check) and the actions (reconnect / failover / health
 * check / heartbeat / recovery), computes health/metrics/connectivity, serves the registry, session,
 * capability and account-synchronization views, and records audit/monitoring/notification/bus signals.
 * It integrates with the Execution Engine, Smart Order Router, Order Management System, Market Data
 * Platform, Live Trading Platform, Monitoring Module, Audit Center, Notification Center, Configuration
 * Foundation, Validation Foundation and Workflow Engine through ports ONLY.
 *
 * It holds no exchange/broker SDK, no API keys, no HTTP/WebSocket/FIX and no connectivity of its own;
 * every venue interaction is delegated to an injected provider adapter (placeholders in v1).
 */
import {
  CAPABILITY_CATALOG,
  PROVIDER_CATALOG,
  canServeCapability,
  capabilityBlockReason,
  describeProvider,
  isActiveStatus,
  isTerminalStatus,
  type Broker,
  type BrokerAction,
  type BrokerCapabilityDescriptor,
  type BrokerCapabilityType,
  type BrokerEvent,
  type BrokerHistory,
  type BrokerMetrics,
  type Environment,
  type GatewayConfiguration,
  type ProviderDescriptor,
  type ProviderId,
} from '@platform/broker-sdk';
import {
  applyAction,
  archive,
  createBroker,
  provisionOnce,
  type TransitionResult,
} from '../domain/lifecycle';
import { computeBrokerMetrics, computeConnectivity, type ConnectivityRow } from '../domain/metrics';
import {
  capabilityMatrix,
  providerRegistrations,
  type CapabilityMatrixRow,
  type ProviderRegistration,
} from '../domain/registry';
import {
  computeBalanceSync,
  computeOrderSync,
  computePositionSync,
  markSynced,
  type BalanceSyncSummary,
  type OrderSyncSummary,
  type PositionSyncSummary,
} from '../domain/sync';
import { gatewaySession, sessionRows, type SessionRow } from '../domain/sessions';
import { applyBrokerQuery, type BrokerQuery, type BrokerScope } from '../domain/search';
import { replayBroker, type ReplayResult } from '../domain/replay';
import type {
  AuditPort,
  BrokerStorePort,
  ConfigurationPort,
  EventBusPort,
  MonitoringPort,
  NotificationPort,
  ProviderRegistryPort,
  ValidationPort,
  WorkflowPort,
} from '../infrastructure/ports';

export type OperationResult =
  | { readonly ok: true; readonly broker: Broker }
  | { readonly ok: false; readonly reason: string };

export interface RegisterBrokerInput {
  readonly id: string;
  readonly name: string;
  readonly providerId: ProviderId;
  readonly environment: Environment;
  readonly region: string;
  readonly capabilities?: readonly BrokerCapabilityType[];
  readonly heartbeatIntervalMs?: number;
}

export interface BrokerGatewayServiceDeps {
  readonly store: BrokerStorePort;
  readonly providers: ProviderRegistryPort;
  readonly validation: ValidationPort;
  readonly workflow: WorkflowPort;
  readonly audit: AuditPort;
  readonly notifications: NotificationPort;
  readonly monitoring: MonitoringPort;
  readonly bus: EventBusPort;
  readonly config: ConfigurationPort;
}

export class BrokerGatewayService {
  constructor(private readonly deps: BrokerGatewayServiceDeps) {}

  /* ------------------------------ read models ------------------------------ */

  listBrokers(): Promise<readonly Broker[]> {
    return this.deps.store.list();
  }
  async searchBrokers(query: BrokerQuery = {}): Promise<readonly Broker[]> {
    return applyBrokerQuery(await this.deps.store.list(), query);
  }
  getBroker(id: string): Promise<Broker | null> {
    return this.deps.store.getById(id);
  }
  private async scope(scope: BrokerScope): Promise<readonly Broker[]> {
    return applyBrokerQuery(await this.deps.store.list(), { scope });
  }
  activeBrokers(): Promise<readonly Broker[]> {
    return this.scope('ACTIVE');
  }
  disconnectedBrokers(): Promise<readonly Broker[]> {
    return this.scope('DISCONNECTED');
  }

  /* ------------------------------ registry views --------------------------- */

  listProviders(): readonly ProviderDescriptor[] {
    return PROVIDER_CATALOG;
  }
  listCapabilities(): readonly BrokerCapabilityDescriptor[] {
    return CAPABILITY_CATALOG;
  }
  capabilityMatrix(): readonly CapabilityMatrixRow[] {
    return capabilityMatrix();
  }
  async providerRegistrations(): Promise<readonly ProviderRegistration[]> {
    return providerRegistrations(await this.deps.store.list());
  }
  registeredProviderIds(): readonly ProviderId[] {
    return this.deps.providers.providerIds();
  }

  /* ------------------------------ health / metrics ------------------------- */

  async metrics(): Promise<BrokerMetrics> {
    return computeBrokerMetrics(await this.deps.store.list());
  }
  async connectivity(): Promise<readonly ConnectivityRow[]> {
    return computeConnectivity(await this.deps.store.list());
  }
  async gatewaySession(startedAt: string): Promise<ReturnType<typeof gatewaySession>> {
    return gatewaySession(await this.deps.store.list(), 1, startedAt);
  }
  async sessions(): Promise<readonly SessionRow[]> {
    return sessionRows(await this.deps.store.list());
  }

  /* ------------------------------ synchronization -------------------------- */

  async positionSync(): Promise<readonly PositionSyncSummary[]> {
    return (await this.deps.store.list())
      .map(computePositionSync)
      .filter((s): s is PositionSyncSummary => s !== null);
  }
  async balanceSync(): Promise<readonly BalanceSyncSummary[]> {
    return (await this.deps.store.list())
      .map(computeBalanceSync)
      .filter((s): s is BalanceSyncSummary => s !== null);
  }
  async orderSync(): Promise<readonly OrderSyncSummary[]> {
    return (await this.deps.store.list())
      .map(computeOrderSync)
      .filter((s): s is OrderSyncSummary => s !== null);
  }
  /** Re-stamp account synchronization for a broker (snapshots are read elsewhere by the provider). */
  async resync(id: string, at: string): Promise<OperationResult> {
    const broker = await this.deps.store.getById(id);
    if (!broker) return { ok: false, reason: `unknown broker ${id}` };
    const next = markSynced(broker, at);
    await this.deps.store.save(next);
    await this.deps.audit.record({ brokerId: id, actor: 'gateway', action: 'RESYNCED', at });
    return { ok: true, broker: next };
  }

  /* ------------------------------ activity views --------------------------- */

  async timeline(id: string): Promise<readonly BrokerEvent[]> {
    const broker = await this.deps.store.getById(id);
    return broker ? broker.events : [];
  }
  async audit(id: string): Promise<Broker['audit']> {
    const broker = await this.deps.store.getById(id);
    return broker ? broker.audit : [];
  }
  async history(id: string): Promise<BrokerHistory | null> {
    const broker = await this.deps.store.getById(id);
    return broker ? { brokerId: broker.id, states: broker.states, events: broker.events } : null;
  }
  async replay(id: string): Promise<ReplayResult | null> {
    const broker = await this.deps.store.getById(id);
    return broker ? replayBroker(broker) : null;
  }

  /* ------------------------------ capability routing ----------------------- */

  /** Whether a broker can currently serve a capability (declared, enabled, operational AND provider supports it). */
  async canServe(
    id: string,
    capability: BrokerCapabilityType,
  ): Promise<{ readonly ok: boolean; readonly reason: string | null }> {
    const broker = await this.deps.store.getById(id);
    if (!broker) return { ok: false, reason: 'unknown broker' };
    const structural = capabilityBlockReason(broker, capability);
    if (structural) return { ok: false, reason: structural };
    if (!this.deps.providers.supports(broker.providerId, capability))
      return { ok: false, reason: 'provider does not support capability' };
    return { ok: canServeCapability(broker, capability), reason: null };
  }

  /* ------------------------------ lifecycle -------------------------------- */

  /** Register a new broker in the gateway (status REGISTERED). */
  async registerBroker(
    input: RegisterBrokerInput,
    actor: string,
    at: string,
  ): Promise<OperationResult> {
    if (!this.deps.providers.resolve(input.providerId))
      return { ok: false, reason: `no adapter registered for provider ${input.providerId}` };
    if (!(await this.deps.validation.isValid(input.id)))
      return { ok: false, reason: 'broker configuration failed validation' };
    const descriptor = describeProvider(input.providerId);
    const configuration: GatewayConfiguration = {
      brokerId: input.id,
      providerId: input.providerId,
      endpointRef: `config://brokers/${input.id}/endpoint`,
      credentialRef: `secret://brokers/${input.id}/api-key`,
      transport: descriptor.transport,
      environment: input.environment,
      heartbeatIntervalMs: input.heartbeatIntervalMs ?? 1000,
      reconnectMaxAttempts: 5,
      capabilities: input.capabilities ?? descriptor.capabilities,
      version: 1,
    };
    const broker = createBroker({
      id: input.id,
      name: input.name,
      configuration,
      region: input.region,
      actor,
      at,
    });
    await this.deps.store.save(broker);
    await this.deps.audit.record({ brokerId: broker.id, actor, action: 'REGISTERED', at });
    await this.publish(broker, 'REGISTERED');
    return { ok: true, broker };
  }

  /** Advance a broker one step along the provisioning happy path. */
  async provision(id: string, actor: string, at: string): Promise<OperationResult> {
    return this.mutate(id, (broker) => provisionOnce(broker, actor, at), actor, at, 'PROVISIONED');
  }

  /** Apply a lifecycle action (reconnect / failover / health_check / heartbeat / recovery). */
  async applyAction(
    id: string,
    action: BrokerAction,
    actor: string,
    at: string,
    targetBrokerId?: string,
  ): Promise<OperationResult> {
    const result = await this.mutate(
      id,
      (broker) => applyAction(broker, action, actor, at, targetBrokerId),
      actor,
      at,
      action.toUpperCase(),
    );
    if (result.ok) {
      await this.deps.monitoring.publishHealth({
        brokerId: result.broker.id,
        level: result.broker.health.level,
        score: result.broker.health.score,
        at,
      });
      if (action === 'failover') {
        await this.deps.workflow.scheduleGatewayTask(id, 'reconnect-backoff');
        await this.deps.notifications.notify({
          brokerId: id,
          channel: 'trading-ops',
          summary: `${result.broker.name} failed over${targetBrokerId ? ` to ${targetBrokerId}` : ''}.`,
        });
      }
    }
    return result;
  }

  /** Archive (retire) a broker. */
  async archiveBroker(id: string, actor: string, at: string): Promise<OperationResult> {
    return this.mutate(id, (broker) => archive(broker, actor, at), actor, at, 'ARCHIVED');
  }

  private async mutate(
    id: string,
    apply: (broker: Broker) => TransitionResult,
    actor: string,
    at: string,
    action: string,
  ): Promise<OperationResult> {
    const broker = await this.deps.store.getById(id);
    if (!broker) return { ok: false, reason: `unknown broker ${id}` };
    const result = apply(broker);
    if (!result.ok) return result;
    await this.deps.store.save(result.broker);
    await this.deps.audit.record({ brokerId: id, actor, action, at });
    await this.publish(result.broker, action);
    return { ok: true, broker: result.broker };
  }

  private async publish(broker: Broker, type: string): Promise<void> {
    await this.deps.bus.publish({
      id: `${broker.id}:${type}:${broker.updatedAt}`,
      brokerId: broker.id,
      type,
      message: `${broker.name} ${type} (${broker.status}).`,
      occurredAt: broker.updatedAt,
    });
  }
}

/** A small summary derived from a set of brokers (for the dashboard header). */
export function summarize(brokers: readonly Broker[]) {
  return {
    total: brokers.length,
    active: brokers.filter((b) => isActiveStatus(b.status)).length,
    healthy: brokers.filter((b) => b.status === 'HEALTHY').length,
    degraded: brokers.filter((b) => b.status === 'DEGRADED').length,
    disconnected: brokers.filter((b) => b.status === 'DISCONNECTED').length,
    archived: brokers.filter((b) => isTerminalStatus(b.status)).length,
  };
}
