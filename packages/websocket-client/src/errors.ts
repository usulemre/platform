/**
 * The canonical WebSocket error hierarchy. Errors carry structured context (never secrets) for
 * correlation and are safe to log.
 */
export type WebSocketErrorKind =
  | 'connection'
  | 'authentication'
  | 'subscription'
  | 'heartbeat-timeout'
  | 'reconnect-failed'
  | 'serialization'
  | 'protocol'
  | 'unknown-message';

export class WebSocketError extends Error {
  readonly kind: WebSocketErrorKind;
  override readonly cause?: unknown;
  constructor(kind: WebSocketErrorKind, message: string, cause?: unknown) {
    super(message);
    this.name = 'WebSocketError';
    this.kind = kind;
    this.cause = cause;
  }
}

export class ConnectionError extends WebSocketError {
  constructor(message: string, cause?: unknown) {
    super('connection', message, cause);
    this.name = 'ConnectionError';
  }
}
export class AuthenticationError extends WebSocketError {
  constructor(message: string, cause?: unknown) {
    super('authentication', message, cause);
    this.name = 'AuthenticationError';
  }
}
export class SubscriptionError extends WebSocketError {
  constructor(
    message: string,
    readonly topic: string,
    cause?: unknown,
  ) {
    super('subscription', message, cause);
    this.name = 'SubscriptionError';
  }
}
export class HeartbeatTimeoutError extends WebSocketError {
  constructor(readonly timeoutMs: number) {
    super('heartbeat-timeout', `No heartbeat within ${timeoutMs}ms.`);
    this.name = 'HeartbeatTimeoutError';
  }
}
export class ReconnectFailedError extends WebSocketError {
  constructor(
    readonly attempts: number,
    cause?: unknown,
  ) {
    super('reconnect-failed', `Reconnect gave up after ${attempts} attempts.`, cause);
    this.name = 'ReconnectFailedError';
  }
}
export class SerializationError extends WebSocketError {
  constructor(message: string, cause?: unknown) {
    super('serialization', message, cause);
    this.name = 'SerializationError';
  }
}
export class ProtocolError extends WebSocketError {
  constructor(message: string, cause?: unknown) {
    super('protocol', message, cause);
    this.name = 'ProtocolError';
  }
}
export class UnknownMessageError extends WebSocketError {
  constructor(readonly raw: unknown) {
    super('unknown-message', 'Received a message that matched no route.');
    this.name = 'UnknownMessageError';
  }
}

export function isWebSocketError(value: unknown): value is WebSocketError {
  return value instanceof WebSocketError;
}
