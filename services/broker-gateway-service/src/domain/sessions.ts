/**
 * Session views — the gateway-level session summary and the per-broker session list. Pure: no IO.
 * Tokens are references only (never secrets). Powers the Session Manager / Session Explorer views.
 */
import type { Broker, BrokerSession, GatewaySession } from '@platform/broker-sdk';

export function gatewaySession(
  brokers: readonly Broker[],
  configVersion: number,
  startedAt: string,
): GatewaySession {
  const connected = brokers.filter(
    (b) => b.status === 'CONNECTED' || b.status === 'HEALTHY' || b.status === 'DEGRADED',
  ).length;
  const healthy = brokers.filter((b) => b.status === 'HEALTHY').length;
  return {
    id: `GWSESSION-${configVersion}`,
    startedAt,
    configVersion,
    brokerCount: brokers.length,
    connectedCount: connected,
    healthyCount: healthy,
  };
}

export interface SessionRow extends BrokerSession {
  readonly brokerName: string;
  readonly providerId: string;
}

export function sessionRows(brokers: readonly Broker[]): readonly SessionRow[] {
  return brokers
    .filter((b): b is Broker & { session: BrokerSession } => Boolean(b.session))
    .map((b) => ({ ...b.session, brokerName: b.name, providerId: b.providerId }))
    .sort((a, b) => b.openedAt.localeCompare(a.openedAt));
}
