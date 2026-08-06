/**
 * Secret abstraction and masking. A `SecretProvider` resolves opaque secret *references* to their
 * values so the rest of the platform never hard-codes credentials; `InMemorySecretProvider` and
 * `EnvSecretProvider` are the built-in sources. `maskSecret` renders a value safe for logs. Security
 * rule: secret VALUES never appear in logs, errors or serialized output — only references and masks.
 */

/** Resolves opaque secret references (e.g. `secret://brokers/x/api-key`) to their values. */
export interface SecretProvider {
  /** The resolved secret value, or `undefined` when the reference is unknown. */
  get(ref: string): string | undefined;
  has(ref: string): boolean;
}

/** An in-memory secret store (development/test, or an adapter over a real vault). */
export class InMemorySecretProvider implements SecretProvider {
  private readonly secrets: Map<string, string>;
  constructor(secrets: Readonly<Record<string, string>> = {}) {
    this.secrets = new Map(Object.entries(secrets));
  }
  get(ref: string): string | undefined {
    return this.secrets.get(ref);
  }
  has(ref: string): boolean {
    return this.secrets.has(ref);
  }
  /** Set/replace a secret (never logged). */
  set(ref: string, value: string): void {
    this.secrets.set(ref, value);
  }
}

/**
 * An environment-backed secret provider. The environment map is INJECTED (not read from `process.env`
 * ambiently) so resolution stays deterministic and testable. A reference maps to an env var, optionally
 * under a `prefix` (e.g. ref `binance/api-key` with prefix `SECRET_` → `SECRET_BINANCE_API_KEY`).
 */
export class EnvSecretProvider implements SecretProvider {
  constructor(
    private readonly env: Readonly<Record<string, string | undefined>>,
    private readonly prefix = '',
  ) {}
  private key(ref: string): string {
    return `${this.prefix}${ref.replace(/[^a-zA-Z0-9]+/g, '_')}`.toUpperCase();
  }
  get(ref: string): string | undefined {
    return this.env[this.key(ref)];
  }
  has(ref: string): boolean {
    return this.env[this.key(ref)] !== undefined;
  }
}

/**
 * Render a secret safe for logging: reveal at most the first and last two characters of a
 * sufficiently long value, mask the middle, and never reveal the exact length. Short values are fully
 * masked.
 */
export function maskSecret(value: string | undefined): string {
  if (!value) return '';
  if (value.length < 8) return '***';
  return `${value.slice(0, 2)}***${value.slice(-2)}`;
}
