import { describe, expect, it } from 'vitest';
import { InMemorySecretProvider } from '@platform/auth-core';
import { HttpRateLimitError, HttpRequestBuilder } from '@platform/http-client';
import { BinanceAuthentication, encodeParams } from '../../src/auth/authentication';
import { resolveBinanceConfiguration } from '../../src/config';
import { BinanceApiError, BinanceConfigurationError, BinanceErrorMapper } from '../../src/errors';
import { gatewayConfig, TEST_SECRETS } from '../helpers';
import type { HttpResponse } from '@platform/http-client';

const config = resolveBinanceConfiguration(gatewayConfig());

describe('BinanceAuthentication', () => {
  const auth = new BinanceAuthentication({
    secretProvider: new InMemorySecretProvider(TEST_SECRETS),
  });

  it('encodes params in insertion order', () => {
    expect(encodeParams({ symbol: 'BTCUSDT', side: 'BUY', n: undefined, qty: 1 })).toBe(
      'symbol=BTCUSDT&side=BUY&qty=1',
    );
  });

  it('produces a deterministic HMAC-SHA256 hex signature and verifies it', () => {
    const query = 'symbol=BTCUSDT&timestamp=1';
    const sig = auth.sign(config, query);
    expect(sig).toMatch(/^[0-9a-f]{64}$/);
    expect(auth.sign(config, query)).toBe(sig);
    expect(auth.verify(config, query, sig)).toBe(true);
    expect(auth.verify(config, query, 'deadbeef')).toBe(false);
  });

  it('appends the signature as the final parameter', () => {
    const signed = auth.signParams(config, { symbol: 'BTCUSDT', timestamp: 1 });
    expect(signed.startsWith('symbol=BTCUSDT&timestamp=1&signature=')).toBe(true);
  });

  it('exposes the API key only in the auth header and reports configuration', () => {
    expect(auth.authHeaders(config)['X-MBX-APIKEY']).toBe('test-api-key');
    expect(auth.isConfigured(config)).toBe(true);
  });

  it('fails closed when the secret is unresolved', () => {
    const empty = new BinanceAuthentication({ secretProvider: new InMemorySecretProvider() });
    expect(empty.isConfigured(config)).toBe(false);
    expect(() => empty.sign(config, 'x=1')).toThrow(BinanceConfigurationError);
  });
});

describe('BinanceErrorMapper', () => {
  const mapper = new BinanceErrorMapper();
  const request = HttpRequestBuilder.create(
    'GET',
    'https://api.binance.com/api/v3/account',
  ).build();

  function response(status: number, body: unknown): HttpResponse<unknown> {
    return {
      status,
      statusText: 'ERR',
      ok: status >= 200 && status < 300,
      headers: request.headers,
      body,
      request,
      context: { requestId: 'r', startedAt: 0, completedAt: 0, durationMs: 0, attributes: {} },
      metadata: {},
    };
  }

  it('maps a Binance error envelope to a classified BinanceApiError', () => {
    const err = mapper.fromResponse(response(400, { code: -2010, msg: 'insufficient balance' }));
    expect(err).toBeInstanceOf(BinanceApiError);
    expect(err.code).toBe(-2010);
    expect(err.category).toBe('ORDER_REJECTED');
    expect(err.retryable).toBe(false);
  });

  it('classifies timestamp and rate-limit codes as retryable', () => {
    expect(mapper.fromResponse(response(400, { code: -1021, msg: 'ts' })).category).toBe(
      'TIMESTAMP',
    );
    expect(mapper.fromResponse(response(429, { code: -1003, msg: 'too many' })).retryable).toBe(
      true,
    );
  });

  it('maps resilience errors (rate limit) to a retryable category', () => {
    const mapped = mapper.map(
      new HttpRateLimitError(request, 'api.binance.com', 'exhausted', 1000),
    );
    expect(mapped.category).toBe('RATE_LIMIT');
    expect(mapped.retryable).toBe(true);
  });
});
