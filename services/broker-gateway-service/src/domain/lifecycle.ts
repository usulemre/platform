/**
 * Broker lifecycle application — the REAL, deterministic application of the `@platform/broker-sdk`
 * state machine to a broker aggregate. It creates a broker (registered), advances it through the
 * provisioning states (configured → authenticated → connected → healthy) and applies the lifecycle
 * actions (reconnect / failover / health check / heartbeat / recovery), each producing an immutable
 * new broker with appended event, state and audit records. Pure: no IO, no transport, no connectivity.
 * Any real venue connection would happen behind the provider capability contract — never here.
 */
import {
  canApplyAction,
  canTransition,
  computeBrokerHealth,
  describeProvider,
  isDegraded,
  type Broker,
  type BrokerAction,
  type BrokerEvent,
  type BrokerEventType,
  type BrokerStatus,
  type GatewayConfiguration,
  type ProviderDescriptor,
} from '@platform/broker-sdk';

export type TransitionResult =
  | { readonly ok: true; readonly broker: Broker }
  | { readonly ok: false; readonly reason: string };

let seq = 0;
function eventId(brokerId: string, at: string): string {
  seq += 1;
  return `${brokerId}:evt:${at}:${seq}`;
}

const STATUS_EVENT: Record<BrokerStatus, BrokerEventType> = {
  REGISTERED: 'REGISTERED',
  CONFIGURED: 'CONFIGURED',
  AUTHENTICATED: 'AUTHENTICATED',
  CONNECTED: 'CONNECTED',
  HEALTHY: 'HEALTHY',
  DEGRADED: 'DEGRADED',
  DISCONNECTED: 'DISCONNECTED',
  ARCHIVED: 'ARCHIVED',
};

/** Append a lifecycle transition to a broker (validated by the state machine). */
export function transitionTo(
  broker: Broker,
  to: BrokerStatus,
  actor: string,
  at: string,
  note: string,
  type?: BrokerEventType,
): TransitionResult {
  if (!canTransition(broker.status, to))
    return { ok: false, reason: `illegal transition ${broker.status} → ${to}` };
  const eventType = type ?? STATUS_EVENT[to];
  const event: BrokerEvent = {
    id: eventId(broker.id, at),
    brokerId: broker.id,
    type: eventType,
    status: to,
    message: note,
    actor,
    at,
  };
  return {
    ok: true,
    broker: {
      ...broker,
      status: to,
      updatedAt: at,
      events: [...broker.events, event],
      states: [...broker.states, { status: to, at, note }],
      audit: [
        ...broker.audit,
        {
          id: `${broker.id}:aud:${at}:${seq}`,
          brokerId: broker.id,
          actor,
          action: eventType,
          detail: note,
          at,
        },
      ],
    },
  };
}

/** Register a new broker in the gateway (status REGISTERED). */
export function createBroker(params: {
  readonly id: string;
  readonly name: string;
  readonly configuration: GatewayConfiguration;
  readonly region: string;
  readonly actor: string;
  readonly at: string;
}): Broker {
  const provider: ProviderDescriptor = describeProvider(params.configuration.providerId);
  const health = computeBrokerHealth({
    brokerId: params.id,
    status: 'REGISTERED',
    heartbeatAgeMs: 0,
    latencyMs: 0,
    errorRate: 0,
    heartbeatIntervalMs: params.configuration.heartbeatIntervalMs,
    at: params.at,
  });
  return {
    id: params.id,
    name: params.name,
    providerId: provider.id,
    providerName: provider.name,
    kind: provider.kind,
    transport: provider.transport,
    environment: params.configuration.environment,
    region: params.region,
    status: 'REGISTERED',
    assetClasses: provider.assetClasses,
    capabilities: params.configuration.capabilities.map((type) => ({ type, enabled: true })),
    configuration: params.configuration,
    connection: {
      brokerId: params.id,
      transport: provider.transport,
      endpointRef: params.configuration.endpointRef,
      status: 'REGISTERED',
      reconnectAttempts: 0,
      latencyMs: 0,
    },
    health,
    events: [
      {
        id: eventId(params.id, params.at),
        brokerId: params.id,
        type: 'REGISTERED',
        status: 'REGISTERED',
        message: `Registered ${provider.name}.`,
        actor: params.actor,
        at: params.at,
      },
    ],
    states: [{ status: 'REGISTERED', at: params.at, note: `Registered ${provider.name}.` }],
    audit: [
      {
        id: `${params.id}:aud:${params.at}:0`,
        brokerId: params.id,
        actor: params.actor,
        action: 'REGISTERED',
        detail: `Registered ${provider.name}.`,
        at: params.at,
      },
    ],
    reconnectAttempts: 0,
    createdAt: params.at,
    updatedAt: params.at,
  };
}

/* ------------------------------ provisioning ------------------------------ */

export function configure(broker: Broker, actor: string, at: string): TransitionResult {
  return transitionTo(broker, 'CONFIGURED', actor, at, 'Connection configuration bound.');
}
export function authenticate(broker: Broker, actor: string, at: string): TransitionResult {
  const result = transitionTo(
    broker,
    'AUTHENTICATED',
    actor,
    at,
    'Credentials validated (by reference).',
  );
  if (!result.ok) return result;
  const session = {
    id: `${broker.id}:sess`,
    brokerId: broker.id,
    state: 'OPEN' as const,
    tokenRef: `${broker.configuration.credentialRef}#token`,
    openedAt: at,
    lastActivityAt: at,
  };
  return { ok: true, broker: { ...result.broker, session } };
}
export function connect(
  broker: Broker,
  actor: string,
  at: string,
  latencyMs = 40,
): TransitionResult {
  const result = transitionTo(broker, 'CONNECTED', actor, at, 'Transport session established.');
  if (!result.ok) return result;
  return {
    ok: true,
    broker: {
      ...result.broker,
      connection: {
        ...result.broker.connection,
        status: 'CONNECTED',
        connectedAt: at,
        lastHeartbeatAt: at,
        latencyMs,
      },
    },
  };
}

/** Advance a broker one step along the provisioning happy path (used by the seed/tests). */
export function provisionOnce(broker: Broker, actor: string, at: string): TransitionResult {
  switch (broker.status) {
    case 'REGISTERED':
      return configure(broker, actor, at);
    case 'CONFIGURED':
      return authenticate(broker, actor, at);
    case 'AUTHENTICATED':
      return connect(broker, actor, at);
    case 'CONNECTED':
      return recomputeHealthStatus(broker, actor, at);
    default:
      return { ok: false, reason: `nothing to provision from ${broker.status}` };
  }
}

/* -------------------------------- actions -------------------------------- */

function heartbeatAgeMs(broker: Broker, at: string): number {
  const last = broker.connection.lastHeartbeatAt;
  if (!last) return broker.configuration.heartbeatIntervalMs * 10;
  return Math.max(0, Date.parse(at) - Date.parse(last));
}

/** Recompute health and land on HEALTHY or DEGRADED accordingly (used by health_check). */
export function recomputeHealthStatus(
  broker: Broker,
  actor: string,
  at: string,
  type: BrokerEventType = 'HEALTH_CHECKED',
): TransitionResult {
  const health = computeBrokerHealth({
    brokerId: broker.id,
    status: broker.status === 'CONNECTED' ? 'HEALTHY' : broker.status,
    heartbeatAgeMs: heartbeatAgeMs(broker, at),
    latencyMs: broker.connection.latencyMs,
    errorRate: broker.health.errorRate,
    heartbeatIntervalMs: broker.configuration.heartbeatIntervalMs,
    at,
  });
  const to: BrokerStatus = isDegraded(health) ? 'DEGRADED' : 'HEALTHY';
  const note = `Health ${health.level} (score ${health.score}).`;
  const result = transitionTo({ ...broker, health }, to, actor, at, note, type);
  if (!result.ok) {
    // Already in the target state (e.g. HEALTHY→HEALTHY is not a legal transition): update health in place.
    if (broker.status === to)
      return {
        ok: true,
        broker: {
          ...broker,
          health,
          updatedAt: at,
          events: [
            ...broker.events,
            {
              id: eventId(broker.id, at),
              brokerId: broker.id,
              type,
              status: to,
              message: note,
              actor,
              at,
            },
          ],
        },
      };
    return result;
  }
  return result;
}

/** Apply a lifecycle action to a broker (validated by the state machine). */
export function applyAction(
  broker: Broker,
  action: BrokerAction,
  actor: string,
  at: string,
  targetBrokerId?: string,
): TransitionResult {
  if (!canApplyAction(broker.status, action))
    return { ok: false, reason: `action ${action} not permitted in ${broker.status}` };
  switch (action) {
    case 'reconnect': {
      const result = transitionTo(
        broker,
        'CONNECTED',
        actor,
        at,
        'Reconnected transport session.',
        'RECONNECTED',
      );
      if (!result.ok) return result;
      return {
        ok: true,
        broker: {
          ...result.broker,
          reconnectAttempts: result.broker.reconnectAttempts + 1,
          connection: {
            ...result.broker.connection,
            status: 'CONNECTED',
            connectedAt: at,
            lastHeartbeatAt: at,
            reconnectAttempts: result.broker.connection.reconnectAttempts + 1,
          },
        },
      };
    }
    case 'failover': {
      const result = transitionTo(
        broker,
        'DISCONNECTED',
        actor,
        at,
        targetBrokerId ? `Failed over to ${targetBrokerId}.` : 'Failed over to backup.',
        'FAILED_OVER',
      );
      if (!result.ok) return result;
      return {
        ok: true,
        broker: {
          ...result.broker,
          failoverBrokerId: targetBrokerId ?? result.broker.failoverBrokerId,
          connection: { ...result.broker.connection, status: 'DISCONNECTED', disconnectedAt: at },
        },
      };
    }
    case 'health_check':
      return recomputeHealthStatus(broker, actor, at, 'HEALTH_CHECKED');
    case 'heartbeat': {
      const connection = { ...broker.connection, lastHeartbeatAt: at };
      const event: BrokerEvent = {
        id: eventId(broker.id, at),
        brokerId: broker.id,
        type: 'HEARTBEAT',
        status: broker.status,
        message: 'Heartbeat recorded.',
        actor,
        at,
      };
      return {
        ok: true,
        broker: { ...broker, connection, updatedAt: at, events: [...broker.events, event] },
      };
    }
    case 'recovery': {
      const to: BrokerStatus = broker.status === 'DISCONNECTED' ? 'CONNECTED' : 'HEALTHY';
      const result = transitionTo(
        broker,
        to,
        actor,
        at,
        'Recovered to a healthy state.',
        'RECOVERED',
      );
      if (!result.ok) return result;
      const connection =
        to === 'CONNECTED'
          ? {
              ...result.broker.connection,
              status: 'CONNECTED' as BrokerStatus,
              connectedAt: at,
              lastHeartbeatAt: at,
            }
          : result.broker.connection;
      return { ok: true, broker: { ...result.broker, connection } };
    }
  }
}

/** Archive a broker (retire from the gateway). */
export function archive(broker: Broker, actor: string, at: string): TransitionResult {
  return transitionTo(broker, 'ARCHIVED', actor, at, 'Archived from the gateway.');
}
