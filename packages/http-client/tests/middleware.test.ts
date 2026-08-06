import { describe, it, expect, vi } from 'vitest';
import {
  BaseHttpClient,
  HttpAbortError,
  HttpHeaders,
  HttpRequestBuilder,
  HttpTransportError,
  MiddlewareContext,
  MiddlewareHttpClient,
  MiddlewarePipeline,
  MiddlewarePriority,
  MiddlewareRegistry,
  MiddlewareResult,
  PipelineBuilder,
  PipelineExecutor,
  DEFAULT_MIDDLEWARE_NAMES,
  defaultMiddlewarePlaceholders,
  defineMiddleware,
  isErrorResult,
  isResponseResult,
  passThrough,
  unwrapResult,
  when,
  type HttpRequest,
  type HttpResponse,
  type HttpTransport,
  type Middleware,
  type RawHttpRequest,
  type RawHttpResponse,
  type TerminalHandler,
} from '../src/index';

/* --------------------------------- helpers --------------------------------- */

function makeRequest(url = 'https://api.x.com/v1/ping', signal?: AbortSignal): HttpRequest {
  let builder = HttpRequestBuilder.create('GET', url);
  if (signal) builder = builder.signal(signal);
  return builder.build(1000);
}
function makeResponse(request: HttpRequest, body: unknown = 'OK', status = 200): HttpResponse {
  return {
    status,
    statusText: 'OK',
    ok: status >= 200 && status < 300,
    headers: HttpHeaders.empty(),
    body,
    request,
    context: {
      requestId: request.context.requestId,
      startedAt: 0,
      completedAt: 1,
      durationMs: 1,
      attributes: {},
    },
    metadata: {},
  };
}
function tracer(name: string, log: string[], priority?: number): Middleware {
  return defineMiddleware({ name, priority }, async (ctx, next) => {
    log.push(`${name}:in`);
    const result = await next(ctx);
    log.push(`${name}:out`);
    return result;
  });
}
function terminalWith(log: string[]): TerminalHandler {
  return async (ctx) => {
    log.push('terminal');
    return MiddlewareResult.response(makeResponse(ctx.request));
  };
}

class StubTransport implements HttpTransport {
  last?: RawHttpRequest;
  constructor(private readonly responder: (req: RawHttpRequest) => RawHttpResponse) {}
  async send(req: RawHttpRequest): Promise<RawHttpResponse> {
    this.last = req;
    return this.responder(req);
  }
}
function rawJson(obj: unknown): RawHttpResponse {
  const text = JSON.stringify(obj);
  return {
    status: 200,
    statusText: 'OK',
    headers: { 'content-type': 'application/json' },
    text: async () => text,
    arrayBuffer: async () => new TextEncoder().encode(text).buffer,
    stream: () => null,
  };
}

/* --------------------------------- executor / ordering --------------------------------- */

describe('pipeline execution & ordering', () => {
  it('runs an empty pipeline straight to the terminal', async () => {
    const log: string[] = [];
    const result = await new MiddlewarePipeline().execute(
      MiddlewareContext.create(makeRequest()),
      terminalWith(log),
    );
    expect(isResponseResult(result)).toBe(true);
    expect(log).toEqual(['terminal']);
  });

  it('orders middleware by priority (onion in/out)', async () => {
    const log: string[] = [];
    const pipeline = MiddlewarePipeline.of(
      tracer('C', log, MiddlewarePriority.RETRY),
      tracer('A', log, MiddlewarePriority.TRACING),
      tracer('B', log, MiddlewarePriority.LOGGING),
    );
    await pipeline.execute(MiddlewareContext.create(makeRequest()), terminalWith(log));
    expect(log).toEqual(['A:in', 'B:in', 'C:in', 'terminal', 'C:out', 'B:out', 'A:out']);
    expect(pipeline.list().map((m) => m.name)).toEqual(['A', 'B', 'C']);
  });

  it('keeps insertion order for equal priorities (stable sort)', () => {
    const log: string[] = [];
    const pipeline = MiddlewarePipeline.of(
      tracer('first', log),
      tracer('second', log),
      tracer('third', log),
    );
    expect(pipeline.list().map((m) => m.name)).toEqual(['first', 'second', 'third']);
  });
});

/* --------------------------------- short-circuit / conditional --------------------------------- */

describe('short-circuit & conditional execution', () => {
  it('short-circuits without invoking the terminal', async () => {
    const terminal = vi.fn(terminalWith([]));
    const shortCircuit = defineMiddleware({ name: 'sc' }, async (ctx) =>
      MiddlewareResult.response(makeResponse(ctx.request, 'cached', 200)),
    );
    const result = await MiddlewarePipeline.of(shortCircuit).execute(
      MiddlewareContext.create(makeRequest()),
      terminal,
    );
    expect(terminal).not.toHaveBeenCalled();
    expect(isResponseResult(result) && result.response.body).toBe('cached');
  });

  it('skips middleware whose condition is false', async () => {
    const log: string[] = [];
    const skipped = { ...tracer('skip', log), condition: () => false };
    await MiddlewarePipeline.of(skipped, tracer('run', log)).execute(
      MiddlewareContext.create(makeRequest()),
      terminalWith(log),
    );
    expect(log).toEqual(['run:in', 'terminal', 'run:out']);
  });

  it('when() combines an extra condition', async () => {
    const log: string[] = [];
    const guarded = when((ctx) => ctx.request.url.includes('enabled'), tracer('guarded', log));
    await MiddlewarePipeline.of(guarded).execute(
      MiddlewareContext.create(makeRequest('https://x/disabled')),
      terminalWith(log),
    );
    expect(log).toEqual(['terminal']);
    log.length = 0;
    await MiddlewarePipeline.of(guarded).execute(
      MiddlewareContext.create(makeRequest('https://x/enabled')),
      terminalWith(log),
    );
    expect(log).toEqual(['guarded:in', 'terminal', 'guarded:out']);
  });
});

/* --------------------------------- context propagation / cancellation --------------------------------- */

describe('context propagation & cancellation', () => {
  it('propagates attributes across middleware immutably', async () => {
    let seen: unknown;
    const base = MiddlewareContext.create(makeRequest());
    const setter = defineMiddleware({ name: 'set', priority: 1 }, async (ctx, next) =>
      next(ctx.withAttribute('trace', 'abc')),
    );
    const reader = defineMiddleware({ name: 'read', priority: 2 }, async (ctx, next) => {
      seen = ctx.attribute('trace');
      return next(ctx);
    });
    await MiddlewarePipeline.of(reader, setter).execute(base, terminalWith([]));
    expect(seen).toBe('abc');
    expect(base.hasAttribute('trace')).toBe(false); // original context untouched
  });

  it('supports cancellation via the request signal', async () => {
    const controller = new AbortController();
    controller.abort();
    const cancelAware = defineMiddleware({ name: 'cancel' }, async (ctx, next) =>
      ctx.aborted ? MiddlewareResult.error(new HttpAbortError(ctx.request)) : next(ctx),
    );
    const terminal = vi.fn(terminalWith([]));
    const result = await MiddlewarePipeline.of(cancelAware).execute(
      MiddlewareContext.create(makeRequest('https://x/y', controller.signal)),
      terminal,
    );
    expect(terminal).not.toHaveBeenCalled();
    expect(isErrorResult(result) && result.error).toBeInstanceOf(HttpAbortError);
  });
});

/* --------------------------------- error interception --------------------------------- */

describe('error interception & recovery', () => {
  it('converts a thrown HttpError into an error result', async () => {
    const terminal: TerminalHandler = async (ctx) => {
      throw new HttpTransportError('boom', ctx.request);
    };
    const result = await new PipelineExecutor([]).execute(
      MiddlewareContext.create(makeRequest()),
      terminal,
    );
    expect(isErrorResult(result)).toBe(true);
    expect(() => unwrapResult(result)).toThrow(HttpTransportError);
  });

  it('lets an error middleware recover into a response', async () => {
    const pipeline = PipelineBuilder.create()
      .useError({
        name: 'recover',
        processError: (_error, ctx) =>
          MiddlewareResult.response(makeResponse(ctx.request, 'recovered')),
      })
      .build();
    const terminal: TerminalHandler = async (ctx) => {
      throw new HttpTransportError('boom', ctx.request);
    };
    const result = await pipeline.execute(MiddlewareContext.create(makeRequest()), terminal);
    expect(isResponseResult(result) && result.response.body).toBe('recovered');
  });

  it('a response middleware only sees successful outcomes', async () => {
    const processResponse = vi.fn((response: HttpResponse) => response);
    const pipeline = PipelineBuilder.create()
      .useResponse({ name: 'resp', processResponse })
      .build();
    const terminal: TerminalHandler = async (ctx) => {
      throw new HttpTransportError('boom', ctx.request);
    };
    const result = await pipeline.execute(MiddlewareContext.create(makeRequest()), terminal);
    expect(processResponse).not.toHaveBeenCalled();
    expect(isErrorResult(result)).toBe(true);
  });
});

/* --------------------------------- registry & builder --------------------------------- */

describe('MiddlewareRegistry', () => {
  it('registers, guards duplicates, overrides and unregisters', () => {
    const registry = new MiddlewareRegistry();
    const a = passThrough({ name: 'a', priority: 10 });
    registry.register(a);
    expect(() => registry.register(passThrough({ name: 'a' }))).toThrow(/already registered/);
    registry.register(passThrough({ name: 'a', priority: 20 }), { override: true });
    expect(registry.get('a')?.priority).toBe(20);
    expect(registry.has('a')).toBe(true);
    expect(registry.unregister('a')).toBe(true);
    expect(registry.size).toBe(0);
  });

  it('materializes an ordered pipeline', () => {
    const registry = new MiddlewareRegistry();
    registry.registerAll([
      passThrough({ name: 'late', priority: 900 }),
      passThrough({ name: 'early', priority: 100 }),
    ]);
    expect(
      registry
        .toPipeline()
        .list()
        .map((m) => m.name),
    ).toEqual(['early', 'late']);
  });
});

describe('PipelineBuilder', () => {
  it('composes unified, request, response and error middleware', () => {
    const pipeline = PipelineBuilder.create()
      .use(passThrough({ name: 'u', priority: 50 }))
      .useRequest({ name: 'req', priority: 10, processRequest: (ctx) => ctx })
      .useResponse({ name: 'res', priority: 20, processResponse: (r) => r })
      .useError({ name: 'err', priority: 30, processError: (e) => MiddlewareResult.error(e) })
      .build();
    expect(pipeline.size).toBe(4);
    expect(pipeline.list().map((m) => m.name)).toEqual(['req', 'res', 'err', 'u']);
  });
});

/* --------------------------------- placeholders --------------------------------- */

describe('default middleware placeholders (inert)', () => {
  it('provides the ten placeholders in priority order, all inert', () => {
    const placeholders = defaultMiddlewarePlaceholders();
    expect(placeholders).toHaveLength(10);
    expect(placeholders.map((m) => m.name)).toEqual(DEFAULT_MIDDLEWARE_NAMES);
    expect(placeholders.every((m) => m.placeholder === true)).toBe(true);
  });

  it('the placeholder pipeline is transparent (does not alter the exchange)', async () => {
    const log: string[] = [];
    const pipeline = new MiddlewarePipeline(defaultMiddlewarePlaceholders());
    const result = await pipeline.execute(
      MiddlewareContext.create(makeRequest()),
      terminalWith(log),
    );
    expect(isResponseResult(result) && result.response.body).toBe('OK');
    expect(log).toEqual(['terminal']); // only the terminal produced anything
  });

  it('registers cleanly in a registry', () => {
    const registry = new MiddlewareRegistry().registerAll(defaultMiddlewarePlaceholders());
    expect(registry.size).toBe(10);
  });
});

/* --------------------------------- integration with the client core --------------------------------- */

describe('MiddlewareHttpClient (integration)', () => {
  it('runs requests through the pipeline without changing the core', async () => {
    const transport = new StubTransport(() => rawJson({ ok: true }));
    const pipeline = PipelineBuilder.create()
      .useRequest({
        name: 'inject-header',
        processRequest: (ctx) =>
          ctx.withRequest({ ...ctx.request, headers: ctx.request.headers.set('X-MW', 'yes') }),
      })
      .useResponse({
        name: 'tag-body',
        processResponse: (response) => ({
          ...response,
          body: { ...(response.body as object), tagged: true },
        }),
      })
      .build();
    const client = new MiddlewareHttpClient({ transport, pipeline });
    const res = await client.get<{ ok: boolean; tagged: boolean }>('https://api.x.com/v1/ping');
    expect(res.body).toEqual({ ok: true, tagged: true });
    expect(transport.last?.headers['X-MW']).toBe('yes');
  });

  it('an error middleware can recover a transport failure end-to-end', async () => {
    const transport: HttpTransport = {
      send: async () => {
        throw new Error('ECONNRESET');
      },
    };
    const pipeline = PipelineBuilder.create()
      .useError({
        name: 'fallback',
        processError: (_error, ctx) =>
          MiddlewareResult.response(makeResponse(ctx.request, { fallback: true })),
      })
      .build();
    const client = new MiddlewareHttpClient({ transport, pipeline });
    const res = await client.get<{ fallback: boolean }>('https://api.x.com/v1/ping');
    expect(res.body).toEqual({ fallback: true });
  });

  it('behaves like the base client when the pipeline is empty', async () => {
    const transport = new StubTransport(() => rawJson({ n: 1 }));
    const base = new BaseHttpClient({ transport });
    const wrapped = new MiddlewareHttpClient({ transport });
    expect((await wrapped.get<{ n: number }>('https://x/y')).body).toEqual(
      (await base.get<{ n: number }>('https://x/y')).body,
    );
  });
});
