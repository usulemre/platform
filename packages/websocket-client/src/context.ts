/**
 * `ConnectionContext` — the immutable snapshot of a connection's identity and state, safe to log and
 * attach to events for the Monitoring Module. Carries no secrets.
 */
import type { ConnectionState } from './state';

export interface ConnectionContext {
  readonly connectionId: string;
  readonly url: string;
  readonly state: ConnectionState;
  readonly sessionId?: string;
  readonly attempt: number;
  readonly startedAt: number;
}

export function createConnectionContext(params: {
  connectionId: string;
  url: string;
  state: ConnectionState;
  attempt: number;
  startedAt: number;
  sessionId?: string;
}): ConnectionContext {
  return {
    connectionId: params.connectionId,
    url: params.url,
    state: params.state,
    sessionId: params.sessionId,
    attempt: params.attempt,
    startedAt: params.startedAt,
  };
}
