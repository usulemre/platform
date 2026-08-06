/**
 * Authentication middleware for the HTTP Middleware Pipeline. It resolves an `AuthenticationStrategy`
 * for each request, builds a signing context from the request (method, path, query, serialized body,
 * plus a fresh timestamp and nonce), applies the strategy, and merges the resulting headers/query into
 * the outgoing request — WITHOUT the client core knowing anything about auth. This is the real
 * authentication middleware that replaces the Phase 8.1.2 placeholder. It never logs secrets; only a
 * masked `AuthenticationContext` is attached to the request metadata.
 */
import {
  AUTHENTICATION_MIDDLEWARE,
  MiddlewarePriority,
  serializeBody,
  type HttpRequest,
  type Middleware,
  type MiddlewareContext,
  type MiddlewareNext,
  type MiddlewareResult,
} from '@platform/http-client';
import type { AuthenticationService } from './service';
import type { AuthenticationStrategy } from './strategy';

export interface AuthenticationMiddlewareOptions {
  readonly service: AuthenticationService;
  /** Resolve the strategy for a request; return `undefined` to skip authentication. */
  readonly resolve: (request: HttpRequest) => AuthenticationStrategy | undefined;
  readonly name?: string;
  readonly priority?: number;
}

function splitUrl(request: HttpRequest): { readonly path: string; readonly query: string } {
  try {
    const url = new URL(request.url);
    return { path: url.pathname, query: url.search.replace(/^\?/, '') };
  } catch {
    return { path: request.url, query: '' };
  }
}

function bodyString(request: HttpRequest): string {
  const { data } = serializeBody(request.body);
  return typeof data === 'string' ? data : '';
}

function applyArtifacts(
  request: HttpRequest,
  artifacts: {
    readonly headers: Readonly<Record<string, string>>;
    readonly query: Readonly<Record<string, string>>;
  },
): HttpRequest {
  let url = request.url;
  const queryEntries = Object.entries(artifacts.query);
  if (queryEntries.length > 0) {
    const qs = queryEntries
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
    url += (url.includes('?') ? '&' : '?') + qs;
  }
  return { ...request, url, headers: request.headers.merge(artifacts.headers) };
}

/** Build the authentication middleware for the HTTP Middleware Pipeline. */
export function createAuthenticationMiddleware(
  options: AuthenticationMiddlewareOptions,
): Middleware {
  const handle = async (
    context: MiddlewareContext,
    next: MiddlewareNext,
  ): Promise<MiddlewareResult> => {
    const strategy = options.resolve(context.request);
    if (!strategy) return next(context);

    const { path, query } = splitUrl(context.request);
    const signingContext = options.service.signingContext({
      method: context.request.method,
      url: context.request.url,
      path,
      query,
      body: bodyString(context.request),
    });
    const { artifacts, context: authContext } = options.service.authenticate(
      strategy,
      signingContext,
      context.request.context.requestId,
    );

    const authenticated = applyArtifacts(context.request, artifacts);
    const withMetadata: HttpRequest = {
      ...authenticated,
      metadata: { ...authenticated.metadata, auth: authContext },
    };
    return next(context.withRequest(withMetadata));
  };
  return {
    name: options.name ?? AUTHENTICATION_MIDDLEWARE,
    priority: options.priority ?? MiddlewarePriority.AUTHENTICATION,
    handle,
  };
}
