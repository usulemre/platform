/**
 * `HttpHeaders` — an immutable, case-insensitive HTTP header collection. Every mutating operation
 * returns a new instance; the underlying store is never exposed. Header names are compared
 * case-insensitively (per RFC 7230) while the original casing of the most recently set name is
 * preserved for display.
 */

/** Header input accepted when constructing headers. */
export type HeadersInit =
  | HttpHeaders
  | Readonly<Record<string, string | number | readonly string[]>>
  | readonly (readonly [string, string])[];

interface Entry {
  readonly name: string;
  readonly value: string;
}

function normalize(name: string): string {
  return name.trim().toLowerCase();
}

export class HttpHeaders {
  /** name(lowercased) → { original name, joined value } */
  private readonly store: ReadonlyMap<string, Entry>;

  private constructor(store: ReadonlyMap<string, Entry>) {
    this.store = store;
  }

  /** The empty header set. */
  static empty(): HttpHeaders {
    return new HttpHeaders(new Map());
  }

  /** Build headers from an object, entry tuples, or another `HttpHeaders`. */
  static from(init?: HeadersInit): HttpHeaders {
    if (init === undefined) return HttpHeaders.empty();
    if (init instanceof HttpHeaders) return init;
    const map = new Map<string, Entry>();
    const add = (name: string, value: string | number | readonly string[]): void => {
      const joined = Array.isArray(value) ? value.join(', ') : String(value);
      map.set(normalize(name), { name: name.trim(), value: joined });
    };
    if (Array.isArray(init)) {
      for (const pair of init as readonly (readonly [string, string])[]) add(pair[0], pair[1]);
    } else {
      for (const [name, value] of Object.entries(
        init as Record<string, string | number | readonly string[]>,
      ))
        add(name, value);
    }
    return new HttpHeaders(map);
  }

  /** Whether a header is present (case-insensitive). */
  has(name: string): boolean {
    return this.store.has(normalize(name));
  }

  /** The value of a header, or `undefined` (case-insensitive). */
  get(name: string): string | undefined {
    return this.store.get(normalize(name))?.value;
  }

  /** Return a new `HttpHeaders` with `name` set to `value` (replacing any existing value). */
  set(name: string, value: string | number | readonly string[]): HttpHeaders {
    const next = new Map(this.store);
    const joined = Array.isArray(value) ? value.join(', ') : String(value);
    next.set(normalize(name), { name: name.trim(), value: joined });
    return new HttpHeaders(next);
  }

  /** Return a new `HttpHeaders` with `value` appended to any existing value (comma-joined). */
  append(name: string, value: string | number): HttpHeaders {
    const key = normalize(name);
    const existing = this.store.get(key);
    if (!existing) return this.set(name, value);
    const next = new Map(this.store);
    next.set(key, { name: existing.name, value: `${existing.value}, ${String(value)}` });
    return new HttpHeaders(next);
  }

  /** Return a new `HttpHeaders` without `name`. */
  delete(name: string): HttpHeaders {
    const key = normalize(name);
    if (!this.store.has(key)) return this;
    const next = new Map(this.store);
    next.delete(key);
    return new HttpHeaders(next);
  }

  /** Return a new `HttpHeaders` merging `other` on top of this (other wins on conflict). */
  merge(other: HeadersInit): HttpHeaders {
    const incoming = HttpHeaders.from(other);
    const next = new Map(this.store);
    for (const [key, entry] of incoming.store) next.set(key, entry);
    return new HttpHeaders(next);
  }

  /** Set a header only if it is absent; returns a new instance if it was added, else `this`. */
  setDefault(name: string, value: string | number): HttpHeaders {
    return this.has(name) ? this : this.set(name, value);
  }

  /** The header names (original casing), in insertion order. */
  names(): readonly string[] {
    return [...this.store.values()].map((e) => e.name);
  }

  /** The `[name, value]` entries (original casing). */
  entries(): readonly (readonly [string, string])[] {
    return [...this.store.values()].map((e) => [e.name, e.value] as const);
  }

  /** A plain object view (original casing). */
  toObject(): Readonly<Record<string, string>> {
    const out: Record<string, string> = {};
    for (const entry of this.store.values()) out[entry.name] = entry.value;
    return out;
  }

  get size(): number {
    return this.store.size;
  }
}
