/**
 * `BinanceConfiguration` — the resolved, immutable connection configuration for one Binance venue
 * (Spot or Futures). It derives from the gateway's {@link GatewayConfiguration} (which carries only
 * references — never secrets) plus provider-local endpoint/tuning overrides, and it fails closed when
 * a required reference is missing. Secrets are ALWAYS resolved elsewhere (by reference) through a
 * `SecretProvider`; this record holds only URLs, references and tuning knobs.
 */
import type { GatewayConfiguration } from '@platform/broker-sdk';
import {
  DEFAULT_ENDPOINTS,
  DEFAULT_EXCHANGE_INFO_TTL_MS,
  DEFAULT_RECV_WINDOW_MS,
  DEFAULT_TIME_SYNC_TTL_MS,
  MARKET_BY_PROVIDER,
  type BinanceMarket,
} from './constants';
import { BinanceConfigurationError } from './errors';

/** Provider-level overrides supplied at construction (endpoints, tuning, environment selection). */
export interface BinanceConfigOverrides {
  readonly restBaseUrl?: string;
  readonly wsBaseUrl?: string;
  readonly recvWindowMs?: number;
  readonly timeSyncTtlMs?: number;
  readonly exchangeInfoTtlMs?: number;
  /** Force testnet endpoints regardless of the gateway environment. */
  readonly testnet?: boolean;
  /**
   * Convention for resolving credential material from a `credentialRef`. Binance needs a public API
   * key (sent in a header) and a secret (used for HMAC signing). Both are looked up by reference.
   */
  readonly apiKeySuffix?: string;
  readonly apiSecretSuffix?: string;
}

/** The fully-resolved Binance configuration for a single broker binding. */
export interface BinanceConfiguration {
  readonly brokerId: string;
  readonly market: BinanceMarket;
  readonly environment: GatewayConfiguration['environment'];
  readonly restBaseUrl: string;
  readonly wsBaseUrl: string;
  readonly credentialRef: string;
  readonly apiKeyRef: string;
  readonly apiSecretRef: string;
  readonly recvWindowMs: number;
  readonly timeSyncTtlMs: number;
  readonly exchangeInfoTtlMs: number;
  readonly heartbeatIntervalMs: number;
  readonly reconnectMaxAttempts: number;
}

/** Whether a gateway environment should use Binance testnet endpoints. */
function isTestnet(env: GatewayConfiguration['environment']): boolean {
  return env === 'SANDBOX' || env === 'PAPER';
}

/**
 * Resolve a {@link BinanceConfiguration} from the gateway config, failing closed on missing required
 * references. Pure and deterministic — no IO, no secret resolution.
 */
export function resolveBinanceConfiguration(
  config: GatewayConfiguration,
  overrides: BinanceConfigOverrides = {},
): BinanceConfiguration {
  const market = MARKET_BY_PROVIDER[config.providerId as keyof typeof MARKET_BY_PROVIDER];
  if (!market)
    throw new BinanceConfigurationError(
      `Provider "${config.providerId}" is not served by @platform/provider-binance.`,
    );
  if (!config.brokerId)
    throw new BinanceConfigurationError('GatewayConfiguration.brokerId is required.');
  if (!config.credentialRef)
    throw new BinanceConfigurationError(
      `Broker "${config.brokerId}" has no credentialRef; signed Binance endpoints cannot be reached.`,
    );

  const testnet = overrides.testnet ?? isTestnet(config.environment);
  const defaults = DEFAULT_ENDPOINTS[market][testnet ? 'testnet' : 'production'];
  const apiKeyRef = `${config.credentialRef}${overrides.apiKeySuffix ?? '/api-key'}`;
  const apiSecretRef = `${config.credentialRef}${overrides.apiSecretSuffix ?? '/api-secret'}`;

  return {
    brokerId: config.brokerId,
    market,
    environment: config.environment,
    restBaseUrl: overrides.restBaseUrl ?? defaults.rest,
    wsBaseUrl: overrides.wsBaseUrl ?? defaults.ws,
    credentialRef: config.credentialRef,
    apiKeyRef,
    apiSecretRef,
    recvWindowMs: overrides.recvWindowMs ?? DEFAULT_RECV_WINDOW_MS,
    timeSyncTtlMs: overrides.timeSyncTtlMs ?? DEFAULT_TIME_SYNC_TTL_MS,
    exchangeInfoTtlMs: overrides.exchangeInfoTtlMs ?? DEFAULT_EXCHANGE_INFO_TTL_MS,
    heartbeatIntervalMs: config.heartbeatIntervalMs > 0 ? config.heartbeatIntervalMs : 30_000,
    reconnectMaxAttempts: config.reconnectMaxAttempts > 0 ? config.reconnectMaxAttempts : 5,
  };
}
