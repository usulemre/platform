/**
 * `MiddlewareHttpClient` — the integration point between the middleware pipeline and the Common HTTP
 * Client Core. It extends `BaseHttpClient` and overrides `send` to run the request through the pipeline,
 * using the core's real dispatch (`super.send`) as the terminal handler. Because every verb method
 * (`get`/`post`/…) routes through `send`, providers gain composable request/response/error processing
 * WITHOUT any change to the client core. It adds no behavior of its own beyond running the pipeline.
 */
import { BaseHttpClient, type BaseHttpClientConfig } from '../client';
import { MiddlewareContext } from './context';
import { MiddlewarePipeline } from './pipeline';
import { MiddlewareResult, unwrapResult } from './result';
import type { TerminalHandler } from './executor';
import type { HttpRequest } from '../request';
import type { HttpResponse } from '../response';

export interface MiddlewareHttpClientConfig extends BaseHttpClientConfig {
  readonly pipeline?: MiddlewarePipeline;
}

export class MiddlewareHttpClient extends BaseHttpClient {
  private readonly pipeline: MiddlewarePipeline;

  constructor(config: MiddlewareHttpClientConfig) {
    super(config);
    this.pipeline = config.pipeline ?? new MiddlewarePipeline();
  }

  override async send<T = unknown>(request: HttpRequest): Promise<HttpResponse<T>> {
    const context = MiddlewareContext.create(request, request.context.createdAt);
    const terminal: TerminalHandler = async (ctx) =>
      MiddlewareResult.response(await super.send(ctx.request));
    const result = await this.pipeline.execute(context, terminal);
    return unwrapResult(result) as HttpResponse<T>;
  }
}

/** Convenience constructor for a middleware-enabled HTTP client. */
export function createMiddlewareHttpClient(
  config: MiddlewareHttpClientConfig,
): MiddlewareHttpClient {
  return new MiddlewareHttpClient(config);
}
