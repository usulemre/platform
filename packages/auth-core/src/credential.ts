/**
 * Immutable credential objects. Secret material is held in `#private` fields — it is therefore
 * invisible to `JSON.stringify`, `console.log`/`util.inspect` and object spreads, and can only be read
 * through the explicit `reveal()` method used by the signing layer. `toJSON`/`toString` emit a masked
 * view. Every credential carries provenance (`createdAt`) and an optional expiry. Credentials are
 * frozen after construction (immutable).
 */
import { maskSecret } from './secret';

export type CredentialType = 'api-key' | 'bearer' | 'hmac' | 'oauth2';

export interface CredentialMeta {
  readonly id: string;
  readonly type: CredentialType;
  readonly createdAt: number;
  readonly expiresAt?: number;
  readonly metadata: Readonly<Record<string, string>>;
}

interface MaskedCredential {
  readonly id: string;
  readonly type: CredentialType;
  readonly createdAt: number;
  readonly expiresAt?: number;
  readonly masked: string;
}

abstract class BaseCredential implements CredentialMeta {
  readonly id: string;
  abstract readonly type: CredentialType;
  readonly createdAt: number;
  readonly expiresAt?: number;
  readonly metadata: Readonly<Record<string, string>>;

  protected constructor(
    id: string,
    createdAt: number,
    expiresAt: number | undefined,
    metadata: Readonly<Record<string, string>>,
  ) {
    this.id = id;
    this.createdAt = createdAt;
    this.expiresAt = expiresAt;
    this.metadata = Object.freeze({ ...metadata });
  }

  /** Whether the credential is expired at `now` (never, if it has no expiry). */
  isExpired(now: number): boolean {
    return this.expiresAt !== undefined && now >= this.expiresAt;
  }

  /** Milliseconds until expiry (Infinity if none, ≤0 if already expired). */
  timeToExpiry(now: number): number {
    return this.expiresAt === undefined ? Number.POSITIVE_INFINITY : this.expiresAt - now;
  }

  protected abstract maskedValue(): string;

  toJSON(): MaskedCredential {
    return {
      id: this.id,
      type: this.type,
      createdAt: this.createdAt,
      expiresAt: this.expiresAt,
      masked: this.maskedValue(),
    };
  }
  toString(): string {
    return `${this.constructor.name}(${this.id}, ${this.maskedValue()})`;
  }
}

/** An API key credential (a single public/secret key string carried in a header or query param). */
export class ApiKeyCredential extends BaseCredential {
  readonly type = 'api-key';
  #key: string;
  constructor(params: {
    id: string;
    key: string;
    createdAt: number;
    expiresAt?: number;
    metadata?: Readonly<Record<string, string>>;
  }) {
    super(params.id, params.createdAt, params.expiresAt, params.metadata ?? {});
    this.#key = params.key;
    Object.freeze(this);
  }
  reveal(): string {
    return this.#key;
  }
  protected maskedValue(): string {
    return `key=${maskSecret(this.#key)}`;
  }
}

/** A bearer token credential (`Authorization: Bearer <token>`). */
export class BearerTokenCredential extends BaseCredential {
  readonly type = 'bearer';
  #token: string;
  constructor(params: {
    id: string;
    token: string;
    createdAt: number;
    expiresAt?: number;
    metadata?: Readonly<Record<string, string>>;
  }) {
    super(params.id, params.createdAt, params.expiresAt, params.metadata ?? {});
    this.#token = params.token;
    Object.freeze(this);
  }
  reveal(): string {
    return this.#token;
  }
  protected maskedValue(): string {
    return `token=${maskSecret(this.#token)}`;
  }
}

/** An HMAC credential — a public `key` (identifier) and a private signing `secret`. */
export class HmacCredential extends BaseCredential {
  readonly type = 'hmac';
  readonly key: string;
  #secret: string;
  constructor(params: {
    id: string;
    key: string;
    secret: string;
    createdAt: number;
    expiresAt?: number;
    metadata?: Readonly<Record<string, string>>;
  }) {
    super(params.id, params.createdAt, params.expiresAt, params.metadata ?? {});
    this.key = params.key;
    this.#secret = params.secret;
    Object.freeze(this);
  }
  /** The signing secret — for the signature layer only. */
  reveal(): string {
    return this.#secret;
  }
  protected maskedValue(): string {
    return `key=${this.key}, secret=${maskSecret(this.#secret)}`;
  }
}

/** An OAuth2 credential (foundation) — an access token, optional refresh token and expiry. */
export class OAuth2Credential extends BaseCredential {
  readonly type = 'oauth2';
  readonly tokenType: string;
  readonly scope?: string;
  #accessToken: string;
  #refreshToken?: string;
  constructor(params: {
    id: string;
    accessToken: string;
    refreshToken?: string;
    tokenType?: string;
    scope?: string;
    createdAt: number;
    expiresAt?: number;
    metadata?: Readonly<Record<string, string>>;
  }) {
    super(params.id, params.createdAt, params.expiresAt, params.metadata ?? {});
    this.tokenType = params.tokenType ?? 'Bearer';
    this.scope = params.scope;
    this.#accessToken = params.accessToken;
    this.#refreshToken = params.refreshToken;
    Object.freeze(this);
  }
  reveal(): string {
    return this.#accessToken;
  }
  revealRefresh(): string | undefined {
    return this.#refreshToken;
  }
  hasRefreshToken(): boolean {
    return this.#refreshToken !== undefined;
  }
  protected maskedValue(): string {
    return `${this.tokenType} access=${maskSecret(this.#accessToken)}${this.#refreshToken ? `, refresh=${maskSecret(this.#refreshToken)}` : ''}`;
  }
}

export type Credential =
  | ApiKeyCredential
  | BearerTokenCredential
  | HmacCredential
  | OAuth2Credential;
