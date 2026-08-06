/**
 * Request body model and serialization. A request body is a tagged, immutable union so the client can
 * serialize it deterministically and set the appropriate `Content-Type`. Automatic JSON serialization
 * lives here. No transport, no provider logic.
 */

/** The immutable request-body union. */
export type RequestBody =
  | { readonly kind: 'none' }
  | { readonly kind: 'json'; readonly value: unknown }
  | { readonly kind: 'text'; readonly value: string }
  | { readonly kind: 'binary'; readonly value: Uint8Array }
  | { readonly kind: 'form'; readonly value: Readonly<Record<string, string | number | boolean>> };

export const NO_BODY: RequestBody = { kind: 'none' };

export function jsonBody(value: unknown): RequestBody {
  return { kind: 'json', value };
}
export function textBody(value: string): RequestBody {
  return { kind: 'text', value };
}
export function binaryBody(value: Uint8Array): RequestBody {
  return { kind: 'binary', value };
}
export function formBody(value: Readonly<Record<string, string | number | boolean>>): RequestBody {
  return { kind: 'form', value };
}

/** The serialized wire form of a body: the bytes/string to send and the default content type. */
export interface SerializedBody {
  readonly data: string | Uint8Array | undefined;
  readonly contentType: string | undefined;
}

function encodeForm(value: Readonly<Record<string, string | number | boolean>>): string {
  return Object.entries(value)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
}

/**
 * Serialize a request body to its wire form and default content type. Throws nothing here — JSON
 * serialization failures surface as the standard `TypeError` from `JSON.stringify` and are wrapped by
 * the client into a typed error.
 */
export function serializeBody(body: RequestBody): SerializedBody {
  switch (body.kind) {
    case 'none':
      return { data: undefined, contentType: undefined };
    case 'json':
      return { data: JSON.stringify(body.value), contentType: 'application/json' };
    case 'text':
      return { data: body.value, contentType: 'text/plain; charset=utf-8' };
    case 'binary':
      return { data: body.value, contentType: 'application/octet-stream' };
    case 'form':
      return { data: encodeForm(body.value), contentType: 'application/x-www-form-urlencoded' };
    default: {
      const exhaustive: never = body;
      return exhaustive;
    }
  }
}
