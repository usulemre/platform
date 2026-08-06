/**
 * `HttpQueryBuilder` — an immutable query-string builder and the URL composition helpers. Values are
 * URL-encoded; arrays expand to repeated keys (`?k=a&k=b`); `undefined`/`null` values are skipped.
 * Pure string composition — no transport, no provider logic.
 */

/** A single query value. */
export type QueryValue = string | number | boolean | null | undefined;
/** Accepted query parameter input. */
export type QueryParamsInit =
  | HttpQueryBuilder
  | Readonly<Record<string, QueryValue | readonly QueryValue[]>>
  | readonly (readonly [string, QueryValue])[];

interface Param {
  readonly key: string;
  readonly value: string;
}

function encode(value: string): string {
  return encodeURIComponent(value);
}

export class HttpQueryBuilder {
  private readonly params: readonly Param[];

  private constructor(params: readonly Param[]) {
    this.params = params;
  }

  static empty(): HttpQueryBuilder {
    return new HttpQueryBuilder([]);
  }

  static from(init?: QueryParamsInit): HttpQueryBuilder {
    if (init === undefined) return HttpQueryBuilder.empty();
    if (init instanceof HttpQueryBuilder) return init;
    let builder = HttpQueryBuilder.empty();
    if (Array.isArray(init)) {
      for (const [key, value] of init as readonly (readonly [string, QueryValue])[])
        builder = builder.append(key, value);
    } else {
      for (const [key, value] of Object.entries(
        init as Record<string, QueryValue | readonly QueryValue[]>,
      ))
        builder = builder.append(key, value as QueryValue | readonly QueryValue[]);
    }
    return builder;
  }

  /** Append a value (or each element of an array) under `key`. `undefined`/`null` are skipped. */
  append(key: string, value: QueryValue | readonly QueryValue[]): HttpQueryBuilder {
    if (Array.isArray(value)) {
      let next: readonly Param[] = this.params;
      for (const item of value as readonly QueryValue[]) {
        if (item === undefined || item === null) continue;
        next = [...next, { key, value: String(item) }];
      }
      return new HttpQueryBuilder(next);
    }
    if (value === undefined || value === null) return this;
    return new HttpQueryBuilder([...this.params, { key, value: String(value as QueryValue) }]);
  }

  /** Set `key` to a single value, replacing any existing occurrences. */
  set(key: string, value: QueryValue): HttpQueryBuilder {
    const filtered = this.params.filter((p) => p.key !== key);
    if (value === undefined || value === null) return new HttpQueryBuilder(filtered);
    return new HttpQueryBuilder([...filtered, { key, value: String(value) }]);
  }

  /** Remove all occurrences of `key`. */
  delete(key: string): HttpQueryBuilder {
    return new HttpQueryBuilder(this.params.filter((p) => p.key !== key));
  }

  /** Whether any parameters are present. */
  isEmpty(): boolean {
    return this.params.length === 0;
  }

  /** The parameter entries. */
  entries(): readonly (readonly [string, string])[] {
    return this.params.map((p) => [p.key, p.value] as const);
  }

  /** The encoded query string, WITHOUT a leading `?`. Keys are sorted stably by insertion order. */
  toString(): string {
    return this.params.map((p) => `${encode(p.key)}=${encode(p.value)}`).join('&');
  }

  /** The query string WITH a leading `?`, or an empty string when there are no parameters. */
  toSearch(): string {
    const query = this.toString();
    return query.length > 0 ? `?${query}` : '';
  }
}

/** Join a base URL and a path safely (single slash between, preserving an absolute path). */
export function joinUrl(base: string, path?: string): string {
  if (!path) return base;
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(path)) return path; // path is already absolute
  const trimmedBase = base.replace(/\/+$/, '');
  const trimmedPath = path.replace(/^\/+/, '');
  return `${trimmedBase}/${trimmedPath}`;
}

/** Compose a full URL from a base, optional path and optional query parameters. */
export function buildUrl(base: string, path?: string, query?: QueryParamsInit): string {
  const url = joinUrl(base, path);
  const builder = HttpQueryBuilder.from(query);
  if (builder.isEmpty()) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${builder.toString()}`;
}
