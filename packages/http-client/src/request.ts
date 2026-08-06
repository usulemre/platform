/**
 * The immutable `HttpRequest` model and the fluent `HttpRequestBuilder`. A request is a fully-composed,
 * transport-agnostic description of an exchange: method, absolute URL (base + path + query already
 * applied), headers, a tagged body, the desired response type, and its context/metadata. The builder
 * is immutable — every method returns a new builder — and performs no IO.
 */
import { NO_BODY, binaryBody, formBody, jsonBody, textBody, type RequestBody } from './body';
import { HttpHeaders, type HeadersInit } from './headers';
import { HttpQueryBuilder, buildUrl, type QueryParamsInit, type QueryValue } from './query';
import {
  createRequestContext,
  type Metadata,
  type RequestContext,
  type RequestContextInit,
} from './context';
import type { HttpMethod } from './method';
import type { ResponseType } from './response';

/** An immutable, fully-composed HTTP request. */
export interface HttpRequest {
  readonly method: HttpMethod;
  /** The absolute request URL (base, path and query already composed). */
  readonly url: string;
  readonly headers: HttpHeaders;
  readonly body: RequestBody;
  readonly responseType: ResponseType;
  readonly context: RequestContext;
  readonly metadata: Metadata;
}

interface BuilderState {
  readonly method: HttpMethod;
  readonly base: string;
  readonly path?: string;
  readonly query: HttpQueryBuilder;
  readonly headers: HttpHeaders;
  readonly body: RequestBody;
  readonly responseType: ResponseType;
  readonly metadata: Metadata;
  readonly context: RequestContextInit;
}

export class HttpRequestBuilder {
  private constructor(private readonly state: BuilderState) {}

  /** Start a builder for `method` at `url` (which may be a base to which a path/query is added). */
  static create(method: HttpMethod, url: string): HttpRequestBuilder {
    return new HttpRequestBuilder({
      method,
      base: url,
      query: HttpQueryBuilder.empty(),
      headers: HttpHeaders.empty(),
      body: NO_BODY,
      responseType: 'json',
      metadata: {},
      context: {},
    });
  }

  private with(patch: Partial<BuilderState>): HttpRequestBuilder {
    return new HttpRequestBuilder({ ...this.state, ...patch });
  }

  method(method: HttpMethod): HttpRequestBuilder {
    return this.with({ method });
  }
  url(url: string): HttpRequestBuilder {
    return this.with({ base: url, path: undefined });
  }
  base(base: string): HttpRequestBuilder {
    return this.with({ base });
  }
  path(path: string): HttpRequestBuilder {
    return this.with({ path });
  }

  query(params: QueryParamsInit): HttpRequestBuilder {
    return this.with({ query: HttpQueryBuilder.from(params) });
  }
  addQuery(key: string, value: QueryValue | readonly QueryValue[]): HttpRequestBuilder {
    return this.with({ query: this.state.query.append(key, value) });
  }

  headers(init: HeadersInit): HttpRequestBuilder {
    return this.with({ headers: this.state.headers.merge(init) });
  }
  header(name: string, value: string | number): HttpRequestBuilder {
    return this.with({ headers: this.state.headers.set(name, value) });
  }

  body(body: RequestBody): HttpRequestBuilder {
    return this.with({ body });
  }
  json(value: unknown): HttpRequestBuilder {
    return this.with({ body: jsonBody(value) });
  }
  text(value: string): HttpRequestBuilder {
    return this.with({ body: textBody(value) });
  }
  binary(value: Uint8Array): HttpRequestBuilder {
    return this.with({ body: binaryBody(value) });
  }
  form(value: Readonly<Record<string, string | number | boolean>>): HttpRequestBuilder {
    return this.with({ body: formBody(value) });
  }

  responseType(responseType: ResponseType): HttpRequestBuilder {
    return this.with({ responseType });
  }
  expectJson(): HttpRequestBuilder {
    return this.responseType('json');
  }
  expectText(): HttpRequestBuilder {
    return this.responseType('text');
  }
  expectBinary(): HttpRequestBuilder {
    return this.responseType('binary');
  }
  expectStream(): HttpRequestBuilder {
    return this.responseType('stream');
  }

  metadata(metadata: Metadata): HttpRequestBuilder {
    return this.with({ metadata: { ...this.state.metadata, ...metadata } });
  }
  tag(...tags: readonly string[]): HttpRequestBuilder {
    return this.with({
      context: { ...this.state.context, tags: [...(this.state.context.tags ?? []), ...tags] },
    });
  }
  correlationId(correlationId: string): HttpRequestBuilder {
    return this.with({ context: { ...this.state.context, correlationId } });
  }
  requestId(requestId: string): HttpRequestBuilder {
    return this.with({ context: { ...this.state.context, requestId } });
  }
  signal(signal: AbortSignal): HttpRequestBuilder {
    return this.with({ context: { ...this.state.context, signal } });
  }
  context(init: RequestContextInit): HttpRequestBuilder {
    return this.with({ context: { ...this.state.context, ...init } });
  }

  /** Compose the immutable `HttpRequest`. `now` seeds the request context timestamp. */
  build(now: number = Date.now()): HttpRequest {
    return {
      method: this.state.method,
      url: buildUrl(this.state.base, this.state.path, this.state.query),
      headers: this.state.headers,
      body: this.state.body,
      responseType: this.state.responseType,
      context: createRequestContext(this.state.context, now),
      metadata: this.state.metadata,
    };
  }
}
