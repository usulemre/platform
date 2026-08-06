/**
 * `AuthenticationService` (the Authentication Engine) — the facade that wires the credential/token/
 * API-key managers, the signature service, the validator, the rotator, the nonce and timestamp
 * providers and the metrics together, and builds authentication strategies from registered credentials.
 * Deterministic: time and nonces come from injected providers. Provider-independent.
 */
import { ApiKeyManager } from './api-key-manager';
import { AuthenticationMetrics } from './metrics';
import { ClockTimestampProvider, type TimestampProvider } from './timestamp';
import { CounterNonceGenerator, type NonceGenerator } from './nonce';
import { CredentialManager } from './credential-manager';
import { CredentialRotator, type RotationPolicy } from './rotation';
import { CredentialValidator } from './validator';
import { SignatureService } from './signature';
import { TokenManager, type TokenSource } from './token-manager';
import { createAuthenticationContext, type AuthenticationContext } from './context';
import { ApiKeyCredential, BearerTokenCredential, HmacCredential } from './credential';
import { AuthMissingCredentialError } from './errors';
import {
  ApiKeyStrategy,
  BearerTokenStrategy,
  HmacSignatureStrategy,
  type ApiKeyStrategyOptions,
  type AuthArtifacts,
  type AuthenticationStrategy,
  type HmacStrategyOptions,
  type SigningContext,
} from './strategy';

export interface AuthenticationServiceDeps {
  readonly clock?: () => number;
  readonly signatures?: SignatureService;
  readonly nonces?: NonceGenerator;
  readonly timestamps?: TimestampProvider;
  readonly tokenSource?: TokenSource;
  readonly rotationPolicy?: RotationPolicy;
}

export interface SigningContextInput {
  readonly method: string;
  readonly url: string;
  readonly path: string;
  readonly query: string;
  readonly body: string;
}

export interface AuthenticationResult {
  readonly artifacts: AuthArtifacts;
  readonly context: AuthenticationContext;
}

export class AuthenticationService {
  readonly credentials: CredentialManager;
  readonly apiKeys: ApiKeyManager;
  readonly tokens: TokenManager;
  readonly signatures: SignatureService;
  readonly validator: CredentialValidator;
  readonly rotator: CredentialRotator;
  readonly nonces: NonceGenerator;
  readonly timestamps: TimestampProvider;
  readonly metrics = new AuthenticationMetrics();
  private readonly clock: () => number;

  constructor(deps: AuthenticationServiceDeps = {}) {
    this.clock = deps.clock ?? Date.now;
    this.signatures = deps.signatures ?? new SignatureService();
    this.nonces = deps.nonces ?? new CounterNonceGenerator();
    this.timestamps = deps.timestamps ?? new ClockTimestampProvider(this.clock);
    this.credentials = new CredentialManager();
    this.apiKeys = new ApiKeyManager(this.credentials);
    this.tokens = new TokenManager({ clock: this.clock, source: deps.tokenSource });
    this.validator = new CredentialValidator(this.signatures);
    this.rotator = new CredentialRotator(this.credentials, deps.rotationPolicy);
  }

  /* ------------------------------ strategy builders ------------------------------ */

  apiKeyStrategy(credentialId: string, options?: ApiKeyStrategyOptions): AuthenticationStrategy {
    const credential = this.credentials.get(credentialId);
    if (!(credential instanceof ApiKeyCredential))
      throw new AuthMissingCredentialError(credentialId);
    return new ApiKeyStrategy(credential, options);
  }
  bearerStrategy(credentialId: string, headerName?: string): AuthenticationStrategy {
    const credential = this.credentials.get(credentialId);
    if (!(credential instanceof BearerTokenCredential))
      throw new AuthMissingCredentialError(credentialId);
    return new BearerTokenStrategy(credential, headerName);
  }
  hmacStrategy(
    credentialId: string,
    options?: Omit<HmacStrategyOptions, 'signatures'> & { signatures?: SignatureService },
  ): AuthenticationStrategy {
    const credential = this.credentials.get(credentialId);
    if (!(credential instanceof HmacCredential)) throw new AuthMissingCredentialError(credentialId);
    return new HmacSignatureStrategy(credential, {
      ...options,
      signatures: options?.signatures ?? this.signatures,
    });
  }

  /* ------------------------------ apply ------------------------------ */

  /** Build a full signing context by adding a fresh timestamp and nonce. */
  signingContext(input: SigningContextInput): SigningContext {
    return { ...input, timestamp: this.timestamps.millis(), nonce: this.nonces.next() };
  }

  /** Apply a strategy to a signing context, producing artifacts and a masked auth context. */
  authenticate(
    strategy: AuthenticationStrategy,
    context: SigningContext,
    requestId?: string,
  ): AuthenticationResult {
    const artifacts = strategy.apply(context);
    if (strategy.signs) this.metrics.onSigned();
    this.metrics.onAuthenticated(strategy.scheme);
    return {
      artifacts,
      context: createAuthenticationContext({
        credentialId: strategy.credentialId,
        scheme: strategy.scheme,
        timestamp: context.timestamp,
        nonce: context.nonce,
        requestId,
      }),
    };
  }

  /** Validate a credential and record the outcome. */
  validate(credentialId: string): { readonly valid: boolean; readonly reason?: string } {
    const credential = this.credentials.require(credentialId);
    const result = this.validator.validate(credential, this.clock());
    this.metrics.onValidated(result.valid);
    return result;
  }
}
