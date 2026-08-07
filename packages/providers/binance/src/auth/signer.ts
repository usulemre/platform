/**
 * `RequestSigner` — the authenticated-request signing authority for the auth module. It composes the
 * reused {@link BinanceAuthentication} (HMAC-SHA256 signing via the Authentication Core, with secrets
 * resolved BY REFERENCE) with the {@link ClockSynchronizer} so every signed request is stamped with a
 * server-aligned timestamp and the configured `recvWindow`. It never holds or logs secret material —
 * only the opaque signature and the public API-key header. Signing itself is delegated (no crypto is
 * reimplemented).
 */
import { encodeParams, type BinanceAuthentication, type BinanceParamValue } from './authentication';
import type { ClockSynchronizer } from './clock';
import type { BinanceConfiguration } from '../config';

export class RequestSigner {
  constructor(
    private readonly auth: BinanceAuthentication,
    private readonly config: BinanceConfiguration,
    private readonly clock: ClockSynchronizer,
  ) {}

  /** The authenticated request headers (public API key by reference — never a secret). */
  authHeaders(): Readonly<Record<string, string>> {
    return this.auth.authHeaders(this.config);
  }

  /** Whether both credential references resolve for this broker binding. */
  isConfigured(): boolean {
    return this.auth.isConfigured(this.config);
  }

  /** HMAC-SHA256 (hex) signature over an arbitrary query string. */
  sign(queryString: string): string {
    return this.auth.sign(this.config, queryString);
  }

  /**
   * Produce a fully-signed query string for a parameter set: append the server-aligned `timestamp` and
   * `recvWindow`, encode in order, then append the HMAC signature as the final parameter.
   */
  signParams(params: Readonly<Record<string, BinanceParamValue>> = {}): string {
    return this.auth.signParams(this.config, {
      ...params,
      recvWindow: this.config.recvWindowMs,
      timestamp: this.clock.timestamp(),
    });
  }

  /** Verify a signature over a query string (used for defensive checks / contract tests). */
  verify(queryString: string, signature: string): boolean {
    return this.auth.verify(this.config, queryString, signature);
  }

  /** Encode parameters without signing (documented insertion-order encoding). */
  encode(params: Readonly<Record<string, BinanceParamValue>>): string {
    return encodeParams(params);
  }
}
