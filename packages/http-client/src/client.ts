/**
 * `HttpClient` interface and `BaseHttpClient` — the generic request/response engine. `BaseHttpClient`
 * composes headers, serializes the body (automatic JSON), dispatches through an injected transport,
 * parses the response into a typed `HttpResponse<T>`, and emits monitoring signals. It is deliberately
 * minimal: NO authentication, NO retry, NO timeout, NO rate limiting and NO circuit breaker — those
 * are separate, later foundations. A non-2xx status is returned normally (never thrown); callers may
 * opt into throwing with `ensureSuccess`.
 */
import { serializeBody } from './body';
import { createResponseContext } from './context';
import {
  HttpAbortError,
  HttpSerializationError,
  HttpStatusError,
  HttpTransportError,
  HttpValidationError,
  isHttpError,
} from './errors';
import { HttpHeaders, type HeadersInit } from './headers';
import { HttpRequestBuilder, type HttpRequest } from './request';
import { parseResponse } from './parser';
import {
  ALWAYS_VALID,
  EMPTY_CONFIGURATION,
  NOOP_MONITORING,
  errorSignal,
  type HttpConfigurationPort,
  type HttpMonitoringPort,
  type HttpRequestValidator,
} from './ports';
import type { Metadata, RequestContextInit } from './context';
import type { HttpMethod } from './method';
import type { QueryParamsInit } from './query';
import type { RequestBody } from './body';
import type { HttpResponse, ResponseType } from './response';
import type { HttpTransport } from './transport';

/** Per-call options for the convenience verb methods. */
export interface RequestOptions {
  readonly headers?: HeadersInit;
  readonly query?: QueryParamsInit;
  readonly responseType?: ResponseType;
  readonly metadata?: Metadata;
  readonly context?: RequestContextInit;
  readonly signal?: AbortSignal;
  readonly tags?: readonly string[];
}

/** A body-bearing option set (POST/PUT/PATCH). */
export interface BodyRequestOptions extends RequestOptions {
  readonly body?: RequestBody;
}

/** The generic HTTP client contract. */
export interface HttpClient {
  send<T = unknown>(request: HttpRequest): Promise<HttpResponse<T>>;
  request<T = unknown>(builder: HttpRequestBuilder): Promise<HttpResponse<T>>;
  get<T = unknown>(url: string, options?: RequestOptions): Promise<HttpResponse<T>>;
  delete<T = unknown>(url: string, options?: RequestOptions): Promise<HttpResponse<T>>;
  head(url: string, options?: RequestOptions): Promise<HttpResponse<undefined>>;
  options<T = unknown>(url: string, options?: RequestOptions): Promise<HttpResponse<T>>;
  post<T = unknown>(
    url: string,
    body?: RequestBody,
    options?: RequestOptions,
  ): Promise<HttpResponse<T>>;
  put<T = unknown>(
    url: string,
    body?: RequestBody,
    options?: RequestOptions,
  ): Promise<HttpResponse<T>>;
  patch<T = unknown>(
    url: string,
    body?: RequestBody,
    options?: RequestOptions,
  ): Promise<HttpResponse<T>>;
}

/** A monotonic clock returning epoch milliseconds. Injected for deterministic timing in tests. */
export type Clock = () => number;

/** Dependencies for a `BaseHttpClient`. Only `transport` is required. */
export interface BaseHttpClientConfig {
  readonly transport: HttpTransport;
  readonly clock?: Clock;
  readonly configuration?: HttpConfigurationPort;
  readonly validator?: HttpRequestValidator;
  readonly monitoring?: HttpMonitoringPort;
  /** Headers applied to every request unless overridden by the request's own headers. */
  readonly defaultHeaders?: HeadersInit;
}

const ACCEPT_BY_TYPE: Record<ResponseType, string> = {
  json: 'application/json',
  text: 'text/plain, */*',
  binary: 'application/octet-stream, */*',
  stream: '*/*',
};

export class BaseHttpClient implements HttpClient {
  private readonly transport: HttpTransport;
  private readonly clock: Clock;
  protected readonly configuration: HttpConfigurationPort;
  private readonly validator: HttpRequestValidator;
  private readonly monitoring: HttpMonitoringPort;
  private readonly defaultHeaders: HttpHeaders;

  constructor(config: BaseHttpClientConfig) {
    this.transport = config.transport;
    this.clock = config.clock ?? Date.now;
    this.configuration = config.configuration ?? EMPTY_CONFIGURATION;
    this.validator = config.validator ?? ALWAYS_VALID;
    this.monitoring = config.monitoring ?? NOOP_MONITORING;
    this.defaultHeaders = HttpHeaders.from(config.defaultHeaders);
  }

  async send<T = unknown>(request: HttpRequest): Promise<HttpResponse<T>> {
    const startedAt = this.clock();
    this.monitoring.onRequest({
      requestId: request.context.requestId,
      method: request.method,
      url: request.url,
      at: startedAt,
    });
    try {
      const validation = this.validator.validate(request);
      if (!validation.valid) throw new HttpValidationError(validation.errors, request);

      let serialized;
      try {
        serialized = serializeBody(request.body);
      } catch (cause) {
        throw new HttpSerializationError('Failed to serialize the request body.', request, cause);
      }

      let headers = this.defaultHeaders.merge(request.headers);
      if (serialized.contentType)
        headers = headers.setDefault('Content-Type', serialized.contentType);
      headers = headers.setDefault('Accept', ACCEPT_BY_TYPE[request.responseType]);

      const raw = await this.dispatch(request, headers, serialized.data);
      const completedAt = this.clock();
      const responseContext = createResponseContext(request.context, startedAt, completedAt);
      const response = await parseResponse<T>(request, raw, responseContext, request.metadata);
      this.monitoring.onResponse({
        requestId: request.context.requestId,
        method: request.method,
        url: request.url,
        status: response.status,
        durationMs: responseContext.durationMs,
        at: completedAt,
      });
      return response;
    } catch (error) {
      const httpError = isHttpError(error)
        ? error
        : new HttpTransportError('The HTTP request failed.', request, error);
      this.monitoring.onError(errorSignal(httpError, this.clock()));
      throw httpError;
    }
  }

  private async dispatch(
    request: HttpRequest,
    headers: HttpHeaders,
    data: string | Uint8Array | undefined,
  ) {
    try {
      return await this.transport.send({
        method: request.method,
        url: request.url,
        headers: headers.toObject(),
        body: data,
        signal: request.context.signal,
      });
    } catch (cause) {
      if (
        request.context.signal?.aborted ||
        (cause instanceof Error && cause.name === 'AbortError')
      )
        throw new HttpAbortError(request, cause);
      throw new HttpTransportError('The transport failed to send the request.', request, cause);
    }
  }

  request<T = unknown>(builder: HttpRequestBuilder): Promise<HttpResponse<T>> {
    return this.send<T>(builder.build(this.clock()));
  }

  private buildRequest(
    method: HttpMethod,
    url: string,
    body: RequestBody | undefined,
    options: RequestOptions,
  ): HttpRequest {
    let builder = HttpRequestBuilder.create(method, url);
    if (options.headers) builder = builder.headers(options.headers);
    if (options.query) builder = builder.query(options.query);
    if (body) builder = builder.body(body);
    builder = builder.responseType(options.responseType ?? 'json');
    if (options.metadata) builder = builder.metadata(options.metadata);
    if (options.context) builder = builder.context(options.context);
    if (options.signal) builder = builder.signal(options.signal);
    if (options.tags) builder = builder.tag(...options.tags);
    return builder.build(this.clock());
  }

  get<T = unknown>(url: string, options: RequestOptions = {}): Promise<HttpResponse<T>> {
    return this.send<T>(this.buildRequest('GET', url, undefined, options));
  }
  delete<T = unknown>(url: string, options: RequestOptions = {}): Promise<HttpResponse<T>> {
    return this.send<T>(this.buildRequest('DELETE', url, undefined, options));
  }
  head(url: string, options: RequestOptions = {}): Promise<HttpResponse<undefined>> {
    return this.send<undefined>(
      this.buildRequest('HEAD', url, undefined, {
        ...options,
        responseType: options.responseType ?? 'text',
      }),
    );
  }
  options<T = unknown>(url: string, options: RequestOptions = {}): Promise<HttpResponse<T>> {
    return this.send<T>(this.buildRequest('OPTIONS', url, undefined, options));
  }
  post<T = unknown>(
    url: string,
    body?: RequestBody,
    options: RequestOptions = {},
  ): Promise<HttpResponse<T>> {
    return this.send<T>(this.buildRequest('POST', url, body, options));
  }
  put<T = unknown>(
    url: string,
    body?: RequestBody,
    options: RequestOptions = {},
  ): Promise<HttpResponse<T>> {
    return this.send<T>(this.buildRequest('PUT', url, body, options));
  }
  patch<T = unknown>(
    url: string,
    body?: RequestBody,
    options: RequestOptions = {},
  ): Promise<HttpResponse<T>> {
    return this.send<T>(this.buildRequest('PATCH', url, body, options));
  }
}

/** Return the response if its status is 2xx, otherwise throw a typed `HttpStatusError`. */
export function ensureSuccess<T>(response: HttpResponse<T>): HttpResponse<T> {
  if (!response.ok) throw new HttpStatusError(response);
  return response;
}
