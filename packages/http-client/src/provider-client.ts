/**
 * `ProviderHttpClient` — the base provider abstraction. It binds a shared, provider-independent
 * `HttpClient` to a provider's base URL, default headers and default query, exposing protected,
 * relative verb helpers to concrete provider clients (implemented in later phases). It is purely
 * compositional: NO provider-specific logic, NO authentication, NO retry, NO timeout, NO rate limiting.
 * Concrete providers extend it and add their own typed endpoints.
 */
import { HttpQueryBuilder, buildUrl, type QueryParamsInit } from './query';
import { HttpHeaders, type HeadersInit } from './headers';
import type { HttpClient, RequestOptions } from './client';
import type { RequestBody } from './body';
import type { HttpResponse } from './response';

export interface ProviderHttpClientConfig {
  readonly baseUrl: string;
  readonly http: HttpClient;
  /** Headers merged into every provider request (overridable per call). */
  readonly defaultHeaders?: HeadersInit;
  /** Query parameters merged into every provider request. */
  readonly defaultQuery?: QueryParamsInit;
}

export abstract class ProviderHttpClient {
  protected readonly baseUrl: string;
  protected readonly http: HttpClient;
  private readonly defaultHeaders: HttpHeaders;
  private readonly defaultQuery: HttpQueryBuilder;

  protected constructor(config: ProviderHttpClientConfig) {
    this.baseUrl = config.baseUrl;
    this.http = config.http;
    this.defaultHeaders = HttpHeaders.from(config.defaultHeaders);
    this.defaultQuery = HttpQueryBuilder.from(config.defaultQuery);
  }

  /** Resolve a relative path against the base URL. */
  protected url(path: string): string {
    return buildUrl(this.baseUrl, path);
  }

  /** Merge the provider defaults with per-call options (call options win). */
  protected resolveOptions(options: RequestOptions = {}): RequestOptions {
    const headers = this.defaultHeaders.merge(options.headers ?? HttpHeaders.empty());
    let query = this.defaultQuery;
    for (const [key, value] of HttpQueryBuilder.from(options.query).entries())
      query = query.append(key, value);
    return { ...options, headers, query };
  }

  protected getRequest<T>(path: string, options?: RequestOptions): Promise<HttpResponse<T>> {
    return this.http.get<T>(this.url(path), this.resolveOptions(options));
  }
  protected deleteRequest<T>(path: string, options?: RequestOptions): Promise<HttpResponse<T>> {
    return this.http.delete<T>(this.url(path), this.resolveOptions(options));
  }
  protected postRequest<T>(
    path: string,
    body?: RequestBody,
    options?: RequestOptions,
  ): Promise<HttpResponse<T>> {
    return this.http.post<T>(this.url(path), body, this.resolveOptions(options));
  }
  protected putRequest<T>(
    path: string,
    body?: RequestBody,
    options?: RequestOptions,
  ): Promise<HttpResponse<T>> {
    return this.http.put<T>(this.url(path), body, this.resolveOptions(options));
  }
  protected patchRequest<T>(
    path: string,
    body?: RequestBody,
    options?: RequestOptions,
  ): Promise<HttpResponse<T>> {
    return this.http.patch<T>(this.url(path), body, this.resolveOptions(options));
  }
  protected headRequest(path: string, options?: RequestOptions): Promise<HttpResponse<undefined>> {
    return this.http.head(this.url(path), this.resolveOptions(options));
  }
}
