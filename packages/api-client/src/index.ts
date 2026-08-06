/**
 * @platform/api-client — a thin, typed HTTP transport over the governed service
 * APIs (Research API / Admin API). It is transport ONLY: it never adjudicates,
 * validates significance, or makes decisions (WCON-2, LLM-2). Auth tokens are
 * supplied BY REFERENCE through a callback and never stored here (SEC-3, FB-14).
 */
import type { Page } from '@platform/types';

export interface ApiClientConfig {
  readonly baseUrl: string;
  /** Returns the current bearer token by reference; secrets are never stored. */
  readonly getAuthToken?: () => string | undefined;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ApiClient {
  constructor(private readonly config: ApiClientConfig) {}

  async request<T>(path: string, init?: RequestInit): Promise<T> {
    const token = this.config.getAuthToken?.();
    const response = await fetch(`${this.config.baseUrl}${path}`, {
      ...init,
      headers: {
        'content-type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    });
    if (!response.ok) {
      throw new ApiError(response.status, response.statusText);
    }
    return (await response.json()) as T;
  }

  get<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'GET' });
  }

  list<T>(path: string): Promise<Page<T>> {
    return this.request<Page<T>>(path, { method: 'GET' });
  }
}
