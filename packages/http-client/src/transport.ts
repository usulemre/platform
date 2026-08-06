/**
 * The transport abstraction — the lowest-level seam that actually sends bytes and returns a raw
 * response. Keeping the transport injectable is what makes the client framework-independent and fully
 * testable: the default `FetchHttpTransport` adapts the standard Fetch API, but any adapter satisfying
 * `HttpTransport` works. The transport implements NO retry, NO timeout, NO auth, NO rate limiting — it
 * performs a single send.
 */

/** A raw, already-serialized request handed to the transport. */
export interface RawHttpRequest {
  readonly method: string;
  readonly url: string;
  readonly headers: Readonly<Record<string, string>>;
  readonly body: string | Uint8Array | undefined;
  readonly signal?: AbortSignal;
}

/** A raw response from the transport, with lazy body accessors (consume at most one). */
export interface RawHttpResponse {
  readonly status: number;
  readonly statusText: string;
  readonly headers: Readonly<Record<string, string>>;
  text(): Promise<string>;
  arrayBuffer(): Promise<ArrayBuffer>;
  stream(): ReadableStream<Uint8Array> | null;
}

/** The transport port: send one raw request, get one raw response. */
export interface HttpTransport {
  send(request: RawHttpRequest): Promise<RawHttpResponse>;
}

/** The subset of the Fetch API the default transport needs. */
export type FetchLike = (input: string, init: RequestInit) => Promise<Response>;

function headersToObject(headers: Headers): Readonly<Record<string, string>> {
  const out: Record<string, string> = {};
  headers.forEach((value, key) => {
    out[key] = value;
  });
  return out;
}

/** The default transport, adapting the standard Fetch API. Inject any `FetchLike` for testing. */
export class FetchHttpTransport implements HttpTransport {
  private readonly fetchFn: FetchLike;

  constructor(fetchFn?: FetchLike) {
    const resolved =
      fetchFn ??
      (typeof globalThis.fetch === 'function'
        ? (globalThis.fetch.bind(globalThis) as FetchLike)
        : undefined);
    if (!resolved)
      throw new Error('No fetch implementation available; pass a FetchLike to FetchHttpTransport.');
    this.fetchFn = resolved;
  }

  async send(request: RawHttpRequest): Promise<RawHttpResponse> {
    const init: RequestInit = {
      method: request.method,
      headers: { ...request.headers },
      signal: request.signal ?? null,
    };
    if (request.body !== undefined) {
      init.body =
        typeof request.body === 'string' ? request.body : (request.body as unknown as BodyInit);
    }
    const response = await this.fetchFn(request.url, init);
    return {
      status: response.status,
      statusText: response.statusText,
      headers: headersToObject(response.headers),
      text: () => response.text(),
      arrayBuffer: () => response.arrayBuffer(),
      stream: () => response.body,
    };
  }
}
