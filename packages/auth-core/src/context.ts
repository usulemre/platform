/**
 * `AuthenticationContext` — the immutable descriptor of one authentication act: which credential and
 * scheme were used, the timestamp and nonce applied, and the correlation id. It carries NO secret
 * material and is safe to log or attach to a request for the Monitoring Module.
 */
export interface AuthenticationContext {
  readonly credentialId: string;
  readonly scheme: string;
  readonly timestamp: number;
  readonly nonce?: string;
  readonly requestId?: string;
}

export function createAuthenticationContext(params: {
  credentialId: string;
  scheme: string;
  timestamp: number;
  nonce?: string;
  requestId?: string;
}): AuthenticationContext {
  return {
    credentialId: params.credentialId,
    scheme: params.scheme,
    timestamp: params.timestamp,
    nonce: params.nonce,
    requestId: params.requestId,
  };
}
