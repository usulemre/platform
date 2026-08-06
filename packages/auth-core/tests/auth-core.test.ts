import { describe, it, expect } from 'vitest';
import {
  HttpRequestBuilder,
  MiddlewareHttpClient,
  MiddlewarePipeline,
  MiddlewarePriority,
  type HttpTransport,
  type RawHttpRequest,
  type RawHttpResponse,
} from '@platform/http-client';
import {
  ApiKeyCredential,
  ApiKeyStrategy,
  AuthExpiredCredentialError,
  AuthMissingCredentialError,
  AuthNotSupportedError,
  AuthenticationService,
  BearerTokenCredential,
  BearerTokenStrategy,
  ClockTimestampProvider,
  CounterNonceGenerator,
  CredentialManager,
  CredentialRotator,
  CredentialValidator,
  EnvSecretProvider,
  HmacCredential,
  HmacSignatureStrategy,
  InMemorySecretProvider,
  OAuth2Credential,
  RandomNonceGenerator,
  SignatureService,
  TokenManager,
  createAuthenticationMiddleware,
  maskSecret,
  toBase64Url,
  utf8,
} from '../src/index';

/* --------------------------------- secret & masking --------------------------------- */

describe('secret abstraction', () => {
  it('resolves and masks without leaking values', () => {
    const provider = new InMemorySecretProvider({ 'brokers/x/secret': 'super-secret-value' });
    expect(provider.get('brokers/x/secret')).toBe('super-secret-value');
    expect(provider.has('nope')).toBe(false);
    expect(maskSecret('super-secret-value')).toBe('su***ue');
    expect(maskSecret('short')).toBe('***');
  });
  it('reads env-backed secrets with a prefix', () => {
    const provider = new EnvSecretProvider({ SECRET_BINANCE_API_KEY: 'k-123' }, 'SECRET_');
    expect(provider.get('binance/api-key')).toBe('k-123');
  });
});

/* --------------------------------- credentials --------------------------------- */

describe('immutable credentials', () => {
  it('never expose secret material in serialization or spreads', () => {
    const secret = 'top-secret-hmac-key';
    const credential = new HmacCredential({ id: 'c1', key: 'PUBLICKEY', secret, createdAt: 0 });
    expect(JSON.stringify(credential)).not.toContain(secret);
    expect(String(credential)).not.toContain(secret);
    expect(Object.values({ ...credential })).not.toContain(secret);
    expect(credential.reveal()).toBe(secret); // explicit reveal still works for signing
  });
  it('are frozen and track expiry', () => {
    const credential = new ApiKeyCredential({
      id: 'c2',
      key: 'abc',
      createdAt: 0,
      expiresAt: 1000,
    });
    expect(() => {
      (credential as unknown as { id: string }).id = 'x';
    }).toThrow();
    expect(credential.isExpired(999)).toBe(false);
    expect(credential.isExpired(1000)).toBe(true);
  });
});

/* --------------------------------- managers --------------------------------- */

describe('credential & token managers', () => {
  it('registers, requires and builds from secrets', () => {
    const manager = new CredentialManager();
    const provider = new InMemorySecretProvider({ 'x/secret': 'sekret' });
    manager.loadHmac(provider, { id: 'h1', key: 'PUB', secretRef: 'x/secret', createdAt: 0 });
    expect(manager.require('h1')).toBeInstanceOf(HmacCredential);
    expect(() => manager.require('missing')).toThrow(AuthMissingCredentialError);
    expect(JSON.stringify(manager.list())).not.toContain('sekret');
  });

  it('manages token expiry and OAuth2 refresh', async () => {
    let now = 0;
    const source = {
      refresh: async (c: OAuth2Credential) =>
        new OAuth2Credential({
          id: c.id,
          accessToken: 'fresh-token',
          refreshToken: 'r',
          createdAt: now,
          expiresAt: now + 10_000,
        }),
    };
    const tokens = new TokenManager({ clock: () => now, source });
    tokens.set(
      new OAuth2Credential({
        id: 'o1',
        accessToken: 'stale',
        refreshToken: 'r',
        createdAt: 0,
        expiresAt: 100,
      }),
    );
    now = 200; // expired
    const refreshed = await tokens.valid('o1');
    expect(refreshed.reveal()).toBe('fresh-token');

    tokens.set(new BearerTokenCredential({ id: 'b1', token: 't', createdAt: 0, expiresAt: 100 }));
    await expect(tokens.valid('b1')).rejects.toBeInstanceOf(AuthExpiredCredentialError);
  });
});

/* --------------------------------- signing --------------------------------- */

describe('signature service', () => {
  it('signs and verifies HMAC-SHA256 deterministically', () => {
    const service = new SignatureService();
    const sig = service.sign('HMAC-SHA256', 'secret', 'message', 'hex');
    expect(sig).toBe(service.sign('HMAC-SHA256', 'secret', 'message', 'hex'));
    expect(service.verify('HMAC-SHA256', 'secret', 'message', sig, 'hex')).toBe(true);
    expect(service.verify('HMAC-SHA256', 'secret', 'message', 'deadbeef', 'hex')).toBe(false);
  });
  it('treats RSA/ECDSA as foundations', () => {
    const service = new SignatureService();
    expect(service.supports('HMAC-SHA256')).toBe(true);
    expect(service.supports('RSA-SHA256')).toBe(false);
    expect(() => service.sign('RSA-SHA256', 'k', 'm', 'hex')).toThrow(AuthNotSupportedError);
  });
});

/* --------------------------------- nonce & timestamp --------------------------------- */

describe('nonce & timestamp providers (deterministic)', () => {
  it('counter and random nonces are reproducible', () => {
    const counter = new CounterNonceGenerator();
    expect([counter.next(), counter.next(), counter.next()]).toEqual(['1', '2', '3']);
    const random = new RandomNonceGenerator(() => 0.5, 4);
    expect(random.next()).toBe('80808080'); // floor(0.5*256)=0x80 per byte
    expect(random.next()).toBe('80808080'); // deterministic given a constant source
  });
  it('timestamps come from the injected clock', () => {
    const ts = new ClockTimestampProvider(() => 1_700_000_000_000);
    expect(ts.millis()).toBe(1_700_000_000_000);
    expect(ts.seconds()).toBe(1_700_000_000);
    expect(ts.iso()).toBe('2023-11-14T22:13:20.000Z');
  });
});

/* --------------------------------- validation & JWT --------------------------------- */

function makeJwt(
  claims: Record<string, unknown>,
  secret: string,
  signatures: SignatureService,
  alg = 'HS256',
): string {
  const header = toBase64Url(utf8(JSON.stringify({ alg, typ: 'JWT' })));
  const payload = toBase64Url(utf8(JSON.stringify(claims)));
  const signingInput = `${header}.${payload}`;
  const signature =
    alg === 'HS256' ? signatures.sign('HMAC-SHA256', secret, signingInput, 'base64url') : 'x';
  return `${signingInput}.${signature}`;
}

describe('credential & JWT validation', () => {
  it('validates credential presence and expiry', () => {
    const validator = new CredentialValidator(new SignatureService());
    expect(
      validator.validate(new ApiKeyCredential({ id: 'a', key: 'k', createdAt: 0 }), 0).valid,
    ).toBe(true);
    expect(
      validator.validate(
        new ApiKeyCredential({ id: 'a', key: 'k', createdAt: 0, expiresAt: 10 }),
        20,
      ),
    ).toEqual({ valid: false, reason: 'expired' });
  });

  it('validates a HS256 JWT and rejects tampering/expiry/alg', () => {
    const signatures = new SignatureService();
    const validator = new CredentialValidator(signatures);
    const secret = 'jwt-secret';
    const token = makeJwt({ sub: 'user', exp: 2000 }, secret, signatures);
    expect(validator.validateJwt(token, { now: 1_000_000, secret }).valid).toBe(true); // now(ms)=1000s < exp 2000s

    const tampered = `${token.slice(0, -2)}xy`;
    expect(validator.validateJwt(tampered, { now: 1_000_000, secret }).reason).toBe(
      'invalid-signature',
    );

    const expired = makeJwt({ sub: 'user', exp: 100 }, secret, signatures);
    expect(validator.validateJwt(expired, { now: 1_000_000, secret }).reason).toBe('expired');

    const rs = makeJwt({ sub: 'user' }, secret, signatures, 'RS256');
    expect(validator.validateJwt(rs, { now: 0, secret, algorithms: ['HS256'] }).reason).toBe(
      'alg-not-allowed:RS256',
    );
  });
});

/* --------------------------------- rotation --------------------------------- */

describe('credential rotation', () => {
  it('detects due credentials and swaps them', () => {
    const manager = new CredentialManager();
    const rotator = new CredentialRotator(manager, { rotateBeforeExpiryMs: 1000 });
    manager.register(new ApiKeyCredential({ id: 'k', key: 'old', createdAt: 0, expiresAt: 5000 }));
    expect(rotator.dueForRotation(manager.require('k'), 3999)).toBe(false);
    expect(rotator.dueForRotation(manager.require('k'), 4000)).toBe(true);
    const record = rotator.rotate(
      'k',
      new ApiKeyCredential({ id: 'k', key: 'new', createdAt: 4000, expiresAt: 9000 }),
      4000,
    );
    expect((record.current as ApiKeyCredential).reveal()).toBe('new');
    expect((manager.require('k') as ApiKeyCredential).reveal()).toBe('new');
  });
});

/* --------------------------------- strategies & service --------------------------------- */

describe('strategies & AuthenticationService', () => {
  it('api-key and bearer strategies inject headers/query', () => {
    const apiKey = new ApiKeyStrategy(
      new ApiKeyCredential({ id: 'a', key: 'KEY123', createdAt: 0 }),
      { in: 'query', name: 'apiKey' },
    );
    const ctx = {
      method: 'GET',
      url: 'https://x/y',
      path: '/y',
      query: '',
      body: '',
      timestamp: 1,
      nonce: 'n',
    };
    expect(apiKey.apply(ctx)).toEqual({ headers: {}, query: { apiKey: 'KEY123' } });
    const bearer = new BearerTokenStrategy(
      new BearerTokenCredential({ id: 'b', token: 'TOK', createdAt: 0 }),
    );
    expect(bearer.apply(ctx).headers).toEqual({ Authorization: 'Bearer TOK' });
  });

  it('hmac strategy signs a canonical payload verifiably', () => {
    const signatures = new SignatureService();
    const credential = new HmacCredential({ id: 'h', key: 'PUB', secret: 'sec', createdAt: 0 });
    const strategy = new HmacSignatureStrategy(credential, { signatures });
    const ctx = {
      method: 'POST',
      url: 'https://x/o',
      path: '/o',
      query: 'a=1',
      body: '{"q":1}',
      timestamp: 100,
      nonce: 'n1',
    };
    const artifacts = strategy.apply(ctx);
    const payload = `100POST/oa=1{"q":1}`;
    expect(artifacts.headers['X-SIGNATURE']).toBe(
      signatures.sign('HMAC-SHA256', 'sec', payload, 'hex'),
    );
    expect(artifacts.headers['X-API-KEY']).toBe('PUB');
    expect(artifacts.headers['X-TIMESTAMP']).toBe('100');
  });

  it('the service builds strategies, applies them and records metrics', () => {
    const service = new AuthenticationService({
      clock: () => 1000,
      nonces: new CounterNonceGenerator(),
    });
    service.apiKeys.addHmac({ id: 'h', key: 'PUB', secret: 'sec', createdAt: 0 });
    const strategy = service.hmacStrategy('h');
    const signingContext = service.signingContext({
      method: 'GET',
      url: 'https://x/y',
      path: '/y',
      query: '',
      body: '',
    });
    expect(signingContext.timestamp).toBe(1000);
    expect(signingContext.nonce).toBe('1');
    const result = service.authenticate(strategy, signingContext);
    expect(result.context.scheme).toBe('hmac');
    expect(service.metrics.snapshot().signed).toBe(1);
  });
});

/* --------------------------------- middleware integration --------------------------------- */

class CapturingTransport implements HttpTransport {
  last?: RawHttpRequest;
  async send(req: RawHttpRequest): Promise<RawHttpResponse> {
    this.last = req;
    const text = '{"ok":true}';
    return {
      status: 200,
      statusText: 'OK',
      headers: {},
      text: async () => text,
      arrayBuffer: async () => new TextEncoder().encode(text).buffer,
      stream: () => null,
    };
  }
}

describe('authentication middleware (integration)', () => {
  it('signs outgoing requests through the pipeline without leaking the secret', async () => {
    const service = new AuthenticationService({
      clock: () => 1700000000000,
      nonces: new CounterNonceGenerator(),
    });
    service.apiKeys.addHmac({
      id: 'main',
      key: 'PUBLIC-KEY',
      secret: 'the-signing-secret',
      createdAt: 0,
    });
    const middleware = createAuthenticationMiddleware({
      service,
      resolve: () => service.hmacStrategy('main'),
    });
    expect(middleware.priority).toBe(MiddlewarePriority.AUTHENTICATION);

    const transport = new CapturingTransport();
    const client = new MiddlewareHttpClient({
      transport,
      pipeline: MiddlewarePipeline.of(middleware),
    });
    await client.send(
      HttpRequestBuilder.create('POST', 'https://api.exchange.com/v1/order?symbol=BTC')
        .json({ qty: 1 })
        .build(0),
    );

    const headers = transport.last!.headers;
    expect(headers['X-API-KEY']).toBe('PUBLIC-KEY');
    expect(headers['X-SIGNATURE']).toBeTruthy();
    expect(headers['X-TIMESTAMP']).toBe('1700000000000');
    // the secret must never appear on the wire
    expect(JSON.stringify(headers)).not.toContain('the-signing-secret');

    // the signature verifies against the canonical payload
    const payload = `1700000000000POST/v1/ordersymbol=BTC${JSON.stringify({ qty: 1 })}`;
    expect(
      service.signatures.verify(
        'HMAC-SHA256',
        'the-signing-secret',
        payload,
        headers['X-SIGNATURE']!,
        'hex',
      ),
    ).toBe(true);
  });

  it('skips requests when no strategy resolves', async () => {
    const service = new AuthenticationService();
    const middleware = createAuthenticationMiddleware({ service, resolve: () => undefined });
    const transport = new CapturingTransport();
    const client = new MiddlewareHttpClient({
      transport,
      pipeline: MiddlewarePipeline.of(middleware),
    });
    await client.get('https://api.x.com/public');
    expect(transport.last!.headers['X-SIGNATURE']).toBeUndefined();
  });
});
