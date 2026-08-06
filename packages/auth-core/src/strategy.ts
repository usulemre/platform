/**
 * Authentication strategies — the framework for turning a credential into the `AuthArtifacts` (headers
 * and/or query parameters) that authenticate a request. `ApiKeyStrategy` and `BearerTokenStrategy` are
 * header/query injectors; `HmacSignatureStrategy` builds a canonical payload and signs it. The exact
 * canonicalization (which is provider-specific) is INJECTED via `buildPayload`; the core ships only a
 * sensible default. No provider-specific scheme is hard-coded here.
 */
import type { ApiKeyCredential, BearerTokenCredential, HmacCredential } from './credential';
import type { SignatureAlgorithmId, SignatureEncoding, SignatureService } from './signature';

/** A transport-agnostic view of the request being authenticated. */
export interface SigningContext {
  readonly method: string;
  readonly url: string;
  readonly path: string;
  /** The query string without a leading `?`. */
  readonly query: string;
  /** The serialized request body (empty string when none/binary). */
  readonly body: string;
  readonly timestamp: number;
  readonly nonce: string;
}

/** The headers/query a strategy contributes to a request. */
export interface AuthArtifacts {
  readonly headers: Readonly<Record<string, string>>;
  readonly query: Readonly<Record<string, string>>;
}

export interface AuthenticationStrategy {
  readonly scheme: string;
  readonly credentialId: string;
  /** Whether producing artifacts requires signing (for metrics). */
  readonly signs: boolean;
  apply(context: SigningContext): AuthArtifacts;
}

export interface ApiKeyStrategyOptions {
  /** Where to place the key (default: header). */
  readonly in?: 'header' | 'query';
  /** Header or query-parameter name (default `X-API-KEY`). */
  readonly name?: string;
}

/** Places an API key in a header or query parameter. */
export class ApiKeyStrategy implements AuthenticationStrategy {
  readonly scheme = 'api-key';
  readonly signs = false;
  readonly credentialId: string;
  private readonly placement: 'header' | 'query';
  private readonly name: string;
  constructor(
    private readonly credential: ApiKeyCredential,
    options: ApiKeyStrategyOptions = {},
  ) {
    this.credentialId = credential.id;
    this.placement = options.in ?? 'header';
    this.name = options.name ?? 'X-API-KEY';
  }
  apply(_context: SigningContext): AuthArtifacts {
    const value = this.credential.reveal();
    return this.placement === 'header'
      ? { headers: { [this.name]: value }, query: {} }
      : { headers: {}, query: { [this.name]: value } };
  }
}

/** Sets `Authorization: Bearer <token>` (header name configurable). */
export class BearerTokenStrategy implements AuthenticationStrategy {
  readonly scheme = 'bearer';
  readonly signs = false;
  readonly credentialId: string;
  constructor(
    private readonly credential: BearerTokenCredential,
    private readonly headerName = 'Authorization',
  ) {
    this.credentialId = credential.id;
  }
  apply(_context: SigningContext): AuthArtifacts {
    return { headers: { [this.headerName]: `Bearer ${this.credential.reveal()}` }, query: {} };
  }
}

export interface HmacStrategyOptions {
  readonly signatures: SignatureService;
  readonly algorithm?: SignatureAlgorithmId;
  readonly encoding?: SignatureEncoding;
  readonly apiKeyHeader?: string;
  readonly signatureHeader?: string;
  readonly timestampHeader?: string;
  readonly nonceHeader?: string;
  /** Canonical string-to-sign (default: `${ts}${METHOD}${path}${query}${body}`). */
  readonly buildPayload?: (context: SigningContext) => string;
}

/** Signs a canonical payload with the HMAC credential's secret and attaches the signature. */
export class HmacSignatureStrategy implements AuthenticationStrategy {
  readonly scheme = 'hmac';
  readonly signs = true;
  readonly credentialId: string;
  private readonly options: Required<Omit<HmacStrategyOptions, 'signatures'>> & {
    signatures: SignatureService;
  };
  constructor(
    private readonly credential: HmacCredential,
    options: HmacStrategyOptions,
  ) {
    this.credentialId = credential.id;
    this.options = {
      signatures: options.signatures,
      algorithm: options.algorithm ?? 'HMAC-SHA256',
      encoding: options.encoding ?? 'hex',
      apiKeyHeader: options.apiKeyHeader ?? 'X-API-KEY',
      signatureHeader: options.signatureHeader ?? 'X-SIGNATURE',
      timestampHeader: options.timestampHeader ?? 'X-TIMESTAMP',
      nonceHeader: options.nonceHeader ?? 'X-NONCE',
      buildPayload:
        options.buildPayload ??
        ((ctx) => `${ctx.timestamp}${ctx.method}${ctx.path}${ctx.query}${ctx.body}`),
    };
  }
  apply(context: SigningContext): AuthArtifacts {
    const payload = this.options.buildPayload(context);
    const signature = this.options.signatures.sign(
      this.options.algorithm,
      this.credential.reveal(),
      payload,
      this.options.encoding,
    );
    const headers: Record<string, string> = {
      [this.options.apiKeyHeader]: this.credential.key,
      [this.options.signatureHeader]: signature,
    };
    if (this.options.timestampHeader)
      headers[this.options.timestampHeader] = String(context.timestamp);
    if (this.options.nonceHeader) headers[this.options.nonceHeader] = context.nonce;
    return { headers, query: {} };
  }
}
