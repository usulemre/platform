import { describe, it, expect, vi } from 'vitest';
import {
  BaseHttpClient,
  FetchHttpTransport,
  HttpAbortError,
  HttpHeaders,
  HttpParseError,
  HttpQueryBuilder,
  HttpRequestBuilder,
  HttpStatus,
  HttpStatusError,
  HttpTransportError,
  HttpValidationError,
  ProviderHttpClient,
  binaryBody,
  buildUrl,
  ensureSuccess,
  formBody,
  isBodylessMethod,
  isSuccess,
  jsonBody,
  joinUrl,
  serializeBody,
  statusCategory,
  type HttpClient,
  type HttpMonitoringPort,
  type HttpRequestValidator,
  type HttpTransport,
  type RawHttpRequest,
  type RawHttpResponse,
} from '../src/index';

/* --------------------------------- helpers --------------------------------- */

interface RawInit {
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
  text?: string;
  bytes?: Uint8Array;
  stream?: ReadableStream<Uint8Array>;
}

function raw(init: RawInit = {}): RawHttpResponse {
  const text = init.text ?? '';
  return {
    status: init.status ?? 200,
    statusText: init.statusText ?? 'OK',
    headers: init.headers ?? {},
    text: async () => text,
    arrayBuffer: async () =>
      init.bytes
        ? init.bytes.buffer.slice(
            init.bytes.byteOffset,
            init.bytes.byteOffset + init.bytes.byteLength,
          )
        : new TextEncoder().encode(text).buffer,
    stream: () => init.stream ?? null,
  };
}

class StubTransport implements HttpTransport {
  last?: RawHttpRequest;
  constructor(
    private readonly responder: (req: RawHttpRequest) => RawHttpResponse | Promise<RawHttpResponse>,
  ) {}
  async send(req: RawHttpRequest): Promise<RawHttpResponse> {
    this.last = req;
    return this.responder(req);
  }
}

/* --------------------------------- vocabulary --------------------------------- */

describe('method / status vocabulary', () => {
  it('classifies bodyless methods and status categories', () => {
    expect(isBodylessMethod('GET')).toBe(true);
    expect(isBodylessMethod('POST')).toBe(false);
    expect(statusCategory(204)).toBe('success');
    expect(statusCategory(404)).toBe('clientError');
    expect(statusCategory(503)).toBe('serverError');
    expect(isSuccess(HttpStatus.CREATED)).toBe(true);
    expect(isSuccess(HttpStatus.BAD_REQUEST)).toBe(false);
  });
});

describe('HttpHeaders (immutable, case-insensitive)', () => {
  it('is case-insensitive and immutable', () => {
    const a = HttpHeaders.from({ 'Content-Type': 'application/json' });
    const b = a.set('X-Trace', 'abc');
    expect(a.has('content-type')).toBe(true);
    expect(a.get('CONTENT-TYPE')).toBe('application/json');
    expect(a.has('x-trace')).toBe(false); // original unchanged
    expect(b.get('x-trace')).toBe('abc');
    expect(a.size).toBe(1);
    expect(b.size).toBe(2);
  });
  it('merges, appends and sets defaults', () => {
    const merged = HttpHeaders.from({ a: '1' }).merge({ A: '2', b: '3' });
    expect(merged.get('a')).toBe('2');
    expect(merged.append('b', '4').get('b')).toBe('3, 4');
    expect(merged.setDefault('a', '9').get('a')).toBe('2');
    expect(merged.setDefault('c', '9').get('c')).toBe('9');
  });
});

describe('HttpQueryBuilder / URL builder', () => {
  it('encodes, expands arrays and skips nullish', () => {
    const q = HttpQueryBuilder.from({ a: '1', b: [2, 3], c: undefined, d: 'a b&c' });
    expect(q.toString()).toBe('a=1&b=2&b=3&d=a%20b%26c');
    expect(q.toSearch()).toBe('?a=1&b=2&b=3&d=a%20b%26c');
    expect(HttpQueryBuilder.empty().toSearch()).toBe('');
  });
  it('joins and builds URLs safely', () => {
    expect(joinUrl('https://api.x.com/', '/v1/ping')).toBe('https://api.x.com/v1/ping');
    expect(joinUrl('https://api.x.com', 'https://other/abs')).toBe('https://other/abs');
    expect(buildUrl('https://api.x.com', 'v1/orders', { symbol: 'BTC' })).toBe(
      'https://api.x.com/v1/orders?symbol=BTC',
    );
    expect(buildUrl('https://api.x.com/p?x=1', undefined, { y: 2 })).toBe(
      'https://api.x.com/p?x=1&y=2',
    );
  });
});

describe('body serialization', () => {
  it('serializes each body kind with a content type', () => {
    expect(serializeBody(jsonBody({ a: 1 }))).toEqual({
      data: '{"a":1}',
      contentType: 'application/json',
    });
    expect(serializeBody(binaryBody(new Uint8Array([1, 2]))).contentType).toBe(
      'application/octet-stream',
    );
    expect(serializeBody(formBody({ a: '1', b: 2 }))).toEqual({
      data: 'a=1&b=2',
      contentType: 'application/x-www-form-urlencoded',
    });
    expect(serializeBody({ kind: 'none' })).toEqual({ data: undefined, contentType: undefined });
  });
});

describe('HttpRequestBuilder (immutable)', () => {
  it('composes an immutable request', () => {
    const base = HttpRequestBuilder.create('GET', 'https://api.x.com')
      .path('v1/time')
      .header('X-A', '1');
    const derived = base.addQuery('recv', 5000).tag('t1').expectText();
    const r1 = base.build(1000);
    const r2 = derived.build(1000);
    expect(r1.url).toBe('https://api.x.com/v1/time');
    expect(r2.url).toBe('https://api.x.com/v1/time?recv=5000');
    expect(r1.responseType).toBe('json');
    expect(r2.responseType).toBe('text');
    expect(r2.context.tags).toEqual(['t1']);
    expect(r1.context.tags).toEqual([]); // base unaffected
    expect(r1.headers.get('x-a')).toBe('1');
  });
});

/* --------------------------------- client --------------------------------- */

function client(
  responder: (req: RawHttpRequest) => RawHttpResponse | Promise<RawHttpResponse>,
  extra: Partial<ConstructorParameters<typeof BaseHttpClient>[0]> = {},
) {
  const transport = new StubTransport(responder);
  const http = new BaseHttpClient({ transport, clock: makeClock([1000, 1000, 1042]), ...extra });
  return { http, transport };
}
function makeClock(values: number[]): () => number {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)] ?? 0;
}

describe('BaseHttpClient', () => {
  it('GETs and parses JSON with response context/metadata', async () => {
    const { http, transport } = client(() =>
      raw({ text: '{"ok":true,"n":7}', headers: { 'content-type': 'application/json' } }),
    );
    const res = await http.get<{ ok: boolean; n: number }>('https://api.x.com/v1/ping', {
      query: { a: 1 },
    });
    expect(res.ok).toBe(true);
    expect(res.body).toEqual({ ok: true, n: 7 });
    expect(res.headers.get('content-type')).toBe('application/json');
    expect(res.context.durationMs).toBe(42);
    expect(transport.last?.url).toBe('https://api.x.com/v1/ping?a=1');
    expect(transport.last?.headers['Accept']).toBe('application/json');
  });

  it('POSTs JSON, setting Content-Type automatically', async () => {
    const { http, transport } = client(() =>
      raw({ status: 201, statusText: 'Created', text: '{}' }),
    );
    const res = await http.post('https://api.x.com/v1/orders', jsonBody({ symbol: 'BTC', qty: 1 }));
    expect(res.status).toBe(201);
    expect(transport.last?.body).toBe('{"symbol":"BTC","qty":1}');
    expect(transport.last?.headers['Content-Type']).toBe('application/json');
  });

  it('supports text, binary and streaming responses', async () => {
    const text = await client(() => raw({ text: 'pong' })).http.get<string>('https://x/y', {
      responseType: 'text',
    });
    expect(text.body).toBe('pong');

    const bytes = new Uint8Array([1, 2, 3]);
    const bin = await client(() => raw({ bytes })).http.get<Uint8Array>('https://x/y', {
      responseType: 'binary',
    });
    expect(Array.from(bin.body)).toEqual([1, 2, 3]);

    const stream = new ReadableStream<Uint8Array>({
      start: (c) => {
        c.enqueue(new Uint8Array([9]));
        c.close();
      },
    });
    const streamed = await client(() => raw({ stream })).http.get<ReadableStream<Uint8Array>>(
      'https://x/y',
      { responseType: 'stream' },
    );
    expect(streamed.body).toBe(stream);
  });

  it('returns non-2xx normally; ensureSuccess throws a typed status error', async () => {
    const { http } = client(() =>
      raw({ status: 404, statusText: 'Not Found', text: '{"error":"missing"}' }),
    );
    const res = await http.get('https://x/y');
    expect(res.ok).toBe(false);
    expect(res.status).toBe(404);
    expect(() => ensureSuccess(res)).toThrow(HttpStatusError);
  });

  it('wraps a JSON parse failure in HttpParseError', async () => {
    const { http } = client(() => raw({ text: 'not json{' }));
    await expect(http.get('https://x/y')).rejects.toBeInstanceOf(HttpParseError);
  });

  it('wraps a transport failure in HttpTransportError', async () => {
    const { http } = client(() => {
      throw new Error('ECONNREFUSED');
    });
    await expect(http.get('https://x/y')).rejects.toBeInstanceOf(HttpTransportError);
  });

  it('maps an aborted request to HttpAbortError', async () => {
    const controller = new AbortController();
    controller.abort();
    const { http } = client(() => {
      throw new Error('aborted');
    });
    await expect(http.get('https://x/y', { signal: controller.signal })).rejects.toBeInstanceOf(
      HttpAbortError,
    );
  });

  it('enforces the injected validator', async () => {
    const validator: HttpRequestValidator = {
      validate: () => ({ valid: false, errors: ['missing base url'] }),
    };
    const { http } = client(() => raw(), { validator });
    await expect(http.get('https://x/y')).rejects.toBeInstanceOf(HttpValidationError);
  });

  it('emits monitoring signals for request and response', async () => {
    const onRequest = vi.fn();
    const onResponse = vi.fn();
    const onError = vi.fn();
    const monitoring: HttpMonitoringPort = { onRequest, onResponse, onError };
    const { http } = client(() => raw({ text: '{}' }), { monitoring });
    await http.get('https://x/y');
    expect(onRequest).toHaveBeenCalledOnce();
    expect(onResponse).toHaveBeenCalledOnce();
    expect(onResponse.mock.calls[0]![0].status).toBe(200);
    expect(onError).not.toHaveBeenCalled();
  });

  it('applies default headers under request headers', async () => {
    const { http, transport } = client(() => raw({ text: '{}' }), {
      defaultHeaders: { 'X-App': 'platform', Accept: 'x/default' },
    });
    await http.get('https://x/y', { headers: { 'X-App': 'override' } });
    expect(transport.last?.headers['X-App']).toBe('override');
    expect(transport.last?.headers['Accept']).toBe('x/default'); // default present → not replaced
  });
});

/* --------------------------------- provider client --------------------------------- */

class TestProvider extends ProviderHttpClient {
  constructor(http: HttpClient) {
    super({
      baseUrl: 'https://api.exchange.com/api',
      http,
      defaultHeaders: { 'X-Provider': 'test' },
      defaultQuery: { version: 'v1' },
    });
  }
  ping() {
    return this.getRequest<{ pong: boolean }>('ping', { query: { extra: '1' } });
  }
}

describe('ProviderHttpClient (base abstraction)', () => {
  it('composes base URL, default headers and default query', async () => {
    const { http, transport } = client(() => raw({ text: '{"pong":true}' }));
    const res = await new TestProvider(http).ping();
    expect(res.body).toEqual({ pong: true });
    expect(transport.last?.url).toBe('https://api.exchange.com/api/ping?version=v1&extra=1');
    expect(transport.last?.headers['X-Provider']).toBe('test');
  });
});

/* --------------------------------- fetch transport --------------------------------- */

describe('FetchHttpTransport', () => {
  it('adapts a FetchLike and forwards method/headers/body', async () => {
    const fetchLike = vi.fn(
      async (_url: string, _init: RequestInit) =>
        new Response('{"ok":1}', {
          status: 200,
          statusText: 'OK',
          headers: { 'content-type': 'application/json' },
        }),
    );
    const transport = new FetchHttpTransport(fetchLike);
    const http = new BaseHttpClient({ transport });
    const res = await http.post<{ ok: number }>('https://api.x.com/v1/orders', jsonBody({ a: 1 }));
    expect(res.body).toEqual({ ok: 1 });
    expect(fetchLike).toHaveBeenCalledOnce();
    const init = fetchLike.mock.calls[0]![1];
    expect(init.method).toBe('POST');
    expect(init.body).toBe('{"a":1}');
  });
});
