/**
 * `TokenManager` — manages bearer and OAuth2 tokens with expiry, and refreshes OAuth2 tokens through an
 * injected `TokenSource` (the OAuth2 refresh flow itself is a *foundation* — a provider supplies the
 * concrete source later). Deterministic: expiry is evaluated against an injected clock.
 */
import { BearerTokenCredential, OAuth2Credential } from './credential';
import { AuthExpiredCredentialError, AuthNotSupportedError } from './errors';

export type TokenCredential = BearerTokenCredential | OAuth2Credential;

/** The OAuth2 refresh seam (foundation): given an expiring credential, produce a fresh one. */
export interface TokenSource {
  refresh(credential: OAuth2Credential): Promise<OAuth2Credential>;
}

export interface TokenManagerDeps {
  readonly clock?: () => number;
  readonly source?: TokenSource;
  /** Refresh this many ms before expiry (default 0 = only when expired). */
  readonly refreshSkewMs?: number;
}

export class TokenManager {
  private readonly tokens = new Map<string, TokenCredential>();
  private readonly clock: () => number;
  private readonly source?: TokenSource;
  private readonly refreshSkewMs: number;

  constructor(deps: TokenManagerDeps = {}) {
    this.clock = deps.clock ?? Date.now;
    this.source = deps.source;
    this.refreshSkewMs = deps.refreshSkewMs ?? 0;
  }

  set(credential: TokenCredential): void {
    this.tokens.set(credential.id, credential);
  }
  get(id: string): TokenCredential | undefined {
    return this.tokens.get(id);
  }
  remove(id: string): boolean {
    return this.tokens.delete(id);
  }

  private needsRefresh(credential: TokenCredential, now: number): boolean {
    return credential.timeToExpiry(now) <= this.refreshSkewMs;
  }

  /**
   * Return a valid token, refreshing an expiring OAuth2 credential via the injected source when
   * possible. Throws if a bearer token is expired, or an OAuth2 token is expired with no source.
   */
  async valid(id: string): Promise<TokenCredential> {
    const credential = this.tokens.get(id);
    if (!credential) throw new AuthExpiredCredentialError(id);
    const now = this.clock();
    if (!this.needsRefresh(credential, now)) return credential;

    if (credential instanceof OAuth2Credential && credential.hasRefreshToken()) {
      if (!this.source) throw new AuthNotSupportedError('OAuth2 refresh');
      const refreshed = await this.source.refresh(credential);
      this.tokens.set(id, refreshed);
      return refreshed;
    }
    throw new AuthExpiredCredentialError(id);
  }
}
