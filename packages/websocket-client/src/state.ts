/**
 * Connection states and the transition table for the WebSocket lifecycle. The canonical path is
 * `DISCONNECTED → CONNECTING → CONNECTED → AUTHENTICATING → AUTHENTICATED → SUBSCRIBED → HEALTHY`,
 * with `RECONNECTING` on loss and `CLOSED` on shutdown. Pure vocabulary and structural rules — no
 * timing, no IO.
 */

export type ConnectionState =
  | 'DISCONNECTED'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'AUTHENTICATING'
  | 'AUTHENTICATED'
  | 'SUBSCRIBED'
  | 'HEALTHY'
  | 'RECONNECTING'
  | 'CLOSED';

export type ConnectionStateCategory =
  | 'idle'
  | 'establishing'
  | 'active'
  | 'recovering'
  | 'terminal';

export interface ConnectionStateDescriptor {
  readonly state: ConnectionState;
  readonly label: string;
  readonly description: string;
  readonly category: ConnectionStateCategory;
  /** Whether application messages may be sent in this state. */
  readonly canSend: boolean;
}

export const CONNECTION_STATES: readonly ConnectionState[] = [
  'DISCONNECTED',
  'CONNECTING',
  'CONNECTED',
  'AUTHENTICATING',
  'AUTHENTICATED',
  'SUBSCRIBED',
  'HEALTHY',
  'RECONNECTING',
  'CLOSED',
];

const DESCRIPTORS: Record<ConnectionState, ConnectionStateDescriptor> = {
  DISCONNECTED: {
    state: 'DISCONNECTED',
    label: 'Disconnected',
    description: 'No socket; the client has not connected or has cleanly torn down.',
    category: 'idle',
    canSend: false,
  },
  CONNECTING: {
    state: 'CONNECTING',
    label: 'Connecting',
    description: 'A socket is being opened to the endpoint.',
    category: 'establishing',
    canSend: false,
  },
  CONNECTED: {
    state: 'CONNECTED',
    label: 'Connected',
    description: 'The socket is open; not yet authenticated or subscribed.',
    category: 'establishing',
    canSend: true,
  },
  AUTHENTICATING: {
    state: 'AUTHENTICATING',
    label: 'Authenticating',
    description: 'An authentication handshake is in progress.',
    category: 'establishing',
    canSend: true,
  },
  AUTHENTICATED: {
    state: 'AUTHENTICATED',
    label: 'Authenticated',
    description: 'The session is authenticated; ready to subscribe.',
    category: 'active',
    canSend: true,
  },
  SUBSCRIBED: {
    state: 'SUBSCRIBED',
    label: 'Subscribed',
    description: 'One or more subscriptions are active.',
    category: 'active',
    canSend: true,
  },
  HEALTHY: {
    state: 'HEALTHY',
    label: 'Healthy',
    description: 'Connected, subscribed and passing heartbeats.',
    category: 'active',
    canSend: true,
  },
  RECONNECTING: {
    state: 'RECONNECTING',
    label: 'Reconnecting',
    description: 'The connection was lost; a reconnect is scheduled/in progress.',
    category: 'recovering',
    canSend: false,
  },
  CLOSED: {
    state: 'CLOSED',
    label: 'Closed',
    description: 'The client was shut down; the socket is closed for good.',
    category: 'terminal',
    canSend: false,
  },
};

export function describeConnectionState(state: ConnectionState): ConnectionStateDescriptor {
  return DESCRIPTORS[state];
}
export function canSend(state: ConnectionState): boolean {
  return DESCRIPTORS[state].canSend;
}
export function isActive(state: ConnectionState): boolean {
  return DESCRIPTORS[state].category === 'active' || DESCRIPTORS[state].category === 'establishing';
}

export const CONNECTION_TRANSITIONS: Record<ConnectionState, readonly ConnectionState[]> = {
  DISCONNECTED: ['CONNECTING', 'CLOSED'],
  CONNECTING: ['CONNECTED', 'RECONNECTING', 'CLOSED'],
  CONNECTED: ['AUTHENTICATING', 'AUTHENTICATED', 'SUBSCRIBED', 'HEALTHY', 'RECONNECTING', 'CLOSED'],
  AUTHENTICATING: ['AUTHENTICATED', 'RECONNECTING', 'CLOSED'],
  AUTHENTICATED: ['SUBSCRIBED', 'HEALTHY', 'RECONNECTING', 'CLOSED'],
  SUBSCRIBED: ['HEALTHY', 'RECONNECTING', 'CLOSED'],
  HEALTHY: ['SUBSCRIBED', 'RECONNECTING', 'CLOSED'],
  RECONNECTING: ['CONNECTING', 'CLOSED'],
  CLOSED: ['CONNECTING'],
};

export function canTransition(from: ConnectionState, to: ConnectionState): boolean {
  return from === to || CONNECTION_TRANSITIONS[from].includes(to);
}
