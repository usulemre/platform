/**
 * The immutable `HttpResponse` model and the response-type vocabulary. A response is generic over its
 * parsed body `T`, which is produced according to the request's `ResponseType` (json / text / binary /
 * stream). Inert data — the client fills it in; nothing here performs IO.
 */
import type { HttpHeaders } from './headers';
import type { Metadata, ResponseContext } from './context';
import type { HttpRequest } from './request';

/** How the client should interpret a response body. */
export type ResponseType = 'json' | 'text' | 'binary' | 'stream';

/** The parsed body type for a given `ResponseType`. */
export type ResponseBodyOf<R extends ResponseType, T> = R extends 'json'
  ? T
  : R extends 'text'
    ? string
    : R extends 'binary'
      ? Uint8Array
      : R extends 'stream'
        ? ReadableStream<Uint8Array>
        : never;

/** An immutable HTTP response with its parsed body of type `T`. */
export interface HttpResponse<T = unknown> {
  readonly status: number;
  readonly statusText: string;
  /** Whether the status is in the 2xx range. */
  readonly ok: boolean;
  readonly headers: HttpHeaders;
  /** The parsed body (per the request's response type). */
  readonly body: T;
  /** The originating request. */
  readonly request: HttpRequest;
  readonly context: ResponseContext;
  readonly metadata: Metadata;
}
