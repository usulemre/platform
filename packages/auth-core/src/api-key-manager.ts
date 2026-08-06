/**
 * `ApiKeyManager` — a focused view over the `CredentialManager` for API-key and HMAC credentials. It is
 * the convenience surface providers use to register and fetch their keys without touching bearer/OAuth2
 * plumbing. Secret material still flows only through the credential objects; nothing is logged.
 */
import { ApiKeyCredential, HmacCredential } from './credential';
import type { CredentialManager } from './credential-manager';
import { AuthMissingCredentialError } from './errors';

export class ApiKeyManager {
  constructor(private readonly credentials: CredentialManager) {}

  addApiKey(params: {
    id: string;
    key: string;
    createdAt: number;
    expiresAt?: number;
    metadata?: Readonly<Record<string, string>>;
  }): ApiKeyCredential {
    const credential = new ApiKeyCredential(params);
    this.credentials.register(credential, { override: true });
    return credential;
  }

  addHmac(params: {
    id: string;
    key: string;
    secret: string;
    createdAt: number;
    expiresAt?: number;
    metadata?: Readonly<Record<string, string>>;
  }): HmacCredential {
    const credential = new HmacCredential(params);
    this.credentials.register(credential, { override: true });
    return credential;
  }

  apiKey(id: string): ApiKeyCredential {
    const credential = this.credentials.get(id);
    if (!(credential instanceof ApiKeyCredential)) throw new AuthMissingCredentialError(id);
    return credential;
  }

  hmac(id: string): HmacCredential {
    const credential = this.credentials.get(id);
    if (!(credential instanceof HmacCredential)) throw new AuthMissingCredentialError(id);
    return credential;
  }
}
