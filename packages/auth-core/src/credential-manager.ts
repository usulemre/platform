/**
 * `CredentialManager` — the name-keyed store of live credentials, plus helpers that build credentials
 * from a `SecretProvider` (so secret VALUES enter only through the secret abstraction, never through
 * source code). It never logs or returns secret material; `list()` yields masked snapshots.
 */
import {
  ApiKeyCredential,
  BearerTokenCredential,
  HmacCredential,
  type Credential,
} from './credential';
import { AuthMissingCredentialError } from './errors';
import type { SecretProvider } from './secret';

export class CredentialManager {
  private readonly credentials = new Map<string, Credential>();

  register(credential: Credential, options: { readonly override?: boolean } = {}): this {
    if (this.credentials.has(credential.id) && !options.override) {
      throw new Error(
        `Credential "${credential.id}" is already registered; pass { override: true } to replace it.`,
      );
    }
    this.credentials.set(credential.id, credential);
    return this;
  }
  unregister(id: string): boolean {
    return this.credentials.delete(id);
  }
  has(id: string): boolean {
    return this.credentials.has(id);
  }
  get(id: string): Credential | undefined {
    return this.credentials.get(id);
  }
  /** Get a credential or throw `AuthMissingCredentialError`. */
  require(id: string): Credential {
    const credential = this.credentials.get(id);
    if (!credential) throw new AuthMissingCredentialError(id);
    return credential;
  }
  ids(): readonly string[] {
    return [...this.credentials.keys()];
  }
  /** Masked snapshots (safe to log). */
  list(): readonly ReturnType<Credential['toJSON']>[] {
    return [...this.credentials.values()].map((c) => c.toJSON());
  }
  get size(): number {
    return this.credentials.size;
  }

  /* ------------------------------ secret-provider builders ------------------------------ */

  /** Build and register an API-key credential from a secret reference. */
  loadApiKey(
    provider: SecretProvider,
    params: {
      id: string;
      keyRef: string;
      createdAt: number;
      expiresAt?: number;
      metadata?: Readonly<Record<string, string>>;
    },
  ): ApiKeyCredential {
    const key = provider.get(params.keyRef);
    if (key === undefined) throw new AuthMissingCredentialError(params.keyRef);
    const credential = new ApiKeyCredential({
      id: params.id,
      key,
      createdAt: params.createdAt,
      expiresAt: params.expiresAt,
      metadata: params.metadata,
    });
    this.register(credential, { override: true });
    return credential;
  }

  /** Build and register a bearer-token credential from a secret reference. */
  loadBearer(
    provider: SecretProvider,
    params: {
      id: string;
      tokenRef: string;
      createdAt: number;
      expiresAt?: number;
      metadata?: Readonly<Record<string, string>>;
    },
  ): BearerTokenCredential {
    const token = provider.get(params.tokenRef);
    if (token === undefined) throw new AuthMissingCredentialError(params.tokenRef);
    const credential = new BearerTokenCredential({
      id: params.id,
      token,
      createdAt: params.createdAt,
      expiresAt: params.expiresAt,
      metadata: params.metadata,
    });
    this.register(credential, { override: true });
    return credential;
  }

  /** Build and register an HMAC credential from a public key and a secret reference. */
  loadHmac(
    provider: SecretProvider,
    params: {
      id: string;
      key: string;
      secretRef: string;
      createdAt: number;
      expiresAt?: number;
      metadata?: Readonly<Record<string, string>>;
    },
  ): HmacCredential {
    const secret = provider.get(params.secretRef);
    if (secret === undefined) throw new AuthMissingCredentialError(params.secretRef);
    const credential = new HmacCredential({
      id: params.id,
      key: params.key,
      secret,
      createdAt: params.createdAt,
      expiresAt: params.expiresAt,
      metadata: params.metadata,
    });
    this.register(credential, { override: true });
    return credential;
  }
}
