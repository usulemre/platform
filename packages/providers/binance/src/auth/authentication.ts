/**
 * `BinanceAuthentication` — Binance request signing, built on the Authentication Core. Binance signs
 * requests with HMAC-SHA256 over the exact request query string, keyed by the account's API secret,
 * and identifies the caller with the public API key in the `X-MBX-APIKEY` header. Both the key and the
 * secret are resolved by REFERENCE through a `SecretProvider` — this class never accepts or stores an
 * inline secret, and secret material never appears in a return value beyond the opaque signature. The
 * cryptography is delegated to the Authentication Core's `SignatureService` (real, deterministic
 * HMAC-SHA256); no crypto is reimplemented here.
 */
import { SignatureService, type SecretProvider } from '@platform/auth-core';
import { API_KEY_HEADER } from '../constants';
import { BinanceConfigurationError } from '../errors';
import type { BinanceConfiguration } from '../config';

/** A single signed-request query parameter value. */
export type BinanceParamValue = string | number | boolean | undefined;

export interface BinanceAuthenticationDeps {
  readonly secretProvider: SecretProvider;
  readonly signatureService?: SignatureService;
}

/** The encoded query string for a set of parameters, preserving insertion order (signature-critical). */
export function encodeParams(params: Readonly<Record<string, BinanceParamValue>>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  }
  return parts.join('&');
}

export class BinanceAuthentication {
  private readonly secrets: SecretProvider;
  private readonly signatures: SignatureService;

  constructor(deps: BinanceAuthenticationDeps) {
    this.secrets = deps.secretProvider;
    this.signatures = deps.signatureService ?? new SignatureService();
  }

  /** Resolve the public API key by reference (fails closed when unconfigured). */
  apiKey(config: BinanceConfiguration): string {
    const key = this.secrets.get(config.apiKeyRef);
    if (!key)
      throw new BinanceConfigurationError(
        `No API key resolved for reference "${config.apiKeyRef}" (broker ${config.brokerId}).`,
      );
    return key;
  }

  /** The authenticated request headers (API key by reference — never a secret). */
  authHeaders(config: BinanceConfiguration): Readonly<Record<string, string>> {
    return { [API_KEY_HEADER]: this.apiKey(config) };
  }

  /** Whether both required credential references resolve for this broker binding. */
  isConfigured(config: BinanceConfiguration): boolean {
    return this.secrets.has(config.apiKeyRef) && this.secrets.has(config.apiSecretRef);
  }

  /** HMAC-SHA256 (hex) signature over a query string, keyed by the API secret (resolved by reference). */
  sign(config: BinanceConfiguration, queryString: string): string {
    const secret = this.secrets.get(config.apiSecretRef);
    if (!secret)
      throw new BinanceConfigurationError(
        `No API secret resolved for reference "${config.apiSecretRef}" (broker ${config.brokerId}).`,
      );
    return this.signatures.sign('HMAC-SHA256', secret, queryString, 'hex');
  }

  /**
   * Sign a parameter set: encode the params in order, append the signature, and return the final
   * signed query string ready to place on the URL. The `signature` is always the LAST parameter.
   */
  signParams(
    config: BinanceConfiguration,
    params: Readonly<Record<string, BinanceParamValue>>,
  ): string {
    const query = encodeParams(params);
    const signature = this.sign(config, query);
    return query.length > 0 ? `${query}&signature=${signature}` : `signature=${signature}`;
  }

  /** Verify a signature (used by contract tests / defensive checks). */
  verify(config: BinanceConfiguration, queryString: string, signature: string): boolean {
    const secret = this.secrets.get(config.apiSecretRef);
    if (!secret) return false;
    return this.signatures.verify('HMAC-SHA256', secret, queryString, signature, 'hex');
  }
}
