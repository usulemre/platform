/**
 * `ResponseParser` — turns a raw transport response into the immutable, typed `HttpResponse<T>`
 * according to the request's `ResponseType`. Automatic JSON parsing lives here; a malformed JSON body
 * surfaces as a typed `HttpParseError`. Streaming and binary bodies are passed through without being
 * buffered beyond what the caller requested.
 */
import { HttpParseError } from './errors';
import { HttpHeaders } from './headers';
import { isSuccess } from './status';
import type { Metadata, ResponseContext } from './context';
import type { HttpRequest } from './request';
import type { HttpResponse } from './response';
import type { RawHttpResponse } from './transport';

async function parseBody(request: HttpRequest, raw: RawHttpResponse): Promise<unknown> {
  switch (request.responseType) {
    case 'json': {
      const text = await raw.text();
      if (text.length === 0) return undefined;
      try {
        return JSON.parse(text);
      } catch (cause) {
        throw new HttpParseError('Failed to parse JSON response body.', request, raw.status, cause);
      }
    }
    case 'text':
      return raw.text();
    case 'binary':
      return new Uint8Array(await raw.arrayBuffer());
    case 'stream':
      return raw.stream();
    default: {
      const exhaustive: never = request.responseType;
      return exhaustive;
    }
  }
}

/** Parse a raw response into a typed `HttpResponse<T>`. */
export async function parseResponse<T>(
  request: HttpRequest,
  raw: RawHttpResponse,
  context: ResponseContext,
  metadata: Metadata = {},
): Promise<HttpResponse<T>> {
  const body = (await parseBody(request, raw)) as T;
  return {
    status: raw.status,
    statusText: raw.statusText,
    ok: isSuccess(raw.status),
    headers: HttpHeaders.from(raw.headers),
    body,
    request,
    context,
    metadata,
  };
}
