/**
 * `CredentialValidator` — validates credentials (presence, non-expiry, well-formedness) and performs
 * JWT validation. HS256 JWTs are verified for real against an injected secret using the constant-time
 * `SignatureService`; RS256/ES256 verification is a *foundation* satisfied by an injected `verify`
 * callback. Expiry/`nbf` are checked in seconds against the injected `now` (ms) with optional tolerance.
 */
import { fromBase64, fromUtf8 } from './crypto';
import type { Credential } from './credential';
import {
  ApiKeyCredential,
  BearerTokenCredential,
  HmacCredential,
  OAuth2Credential,
} from './credential';
import { AuthValidationError } from './errors';
import type { SignatureService, SigningKey } from './signature';

export interface CredentialCheck {
  readonly valid: boolean;
  readonly reason?: string;
}

export interface JwtHeader {
  readonly alg: string;
  readonly typ?: string;
  readonly kid?: string;
  readonly [key: string]: unknown;
}
export interface JwtClaims {
  readonly iss?: string;
  readonly sub?: string;
  readonly aud?: string | readonly string[];
  readonly exp?: number;
  readonly nbf?: number;
  readonly iat?: number;
  readonly [key: string]: unknown;
}
export interface ParsedJwt {
  readonly header: JwtHeader;
  readonly claims: JwtClaims;
  readonly signingInput: string;
  readonly signature: string;
}
export interface JwtValidationOptions {
  readonly now: number;
  readonly secret?: SigningKey;
  readonly algorithms?: readonly string[];
  readonly clockToleranceSec?: number;
  /** Foundation verifier for non-HMAC algorithms (RS256/ES256). */
  readonly verify?: (parsed: ParsedJwt) => boolean;
}
export interface JwtValidationResult {
  readonly valid: boolean;
  readonly reason?: string;
  readonly header?: JwtHeader;
  readonly claims?: JwtClaims;
}

export class CredentialValidator {
  constructor(private readonly signatures: SignatureService) {}

  /** Validate a credential's presence, expiry and structural well-formedness. */
  validate(credential: Credential, now: number): CredentialCheck {
    if (credential.isExpired(now)) return { valid: false, reason: 'expired' };
    if (credential instanceof ApiKeyCredential)
      return credential.reveal().length > 0
        ? { valid: true }
        : { valid: false, reason: 'empty-key' };
    if (credential instanceof BearerTokenCredential)
      return credential.reveal().length > 0
        ? { valid: true }
        : { valid: false, reason: 'empty-token' };
    if (credential instanceof HmacCredential)
      return credential.key.length > 0 && credential.reveal().length > 0
        ? { valid: true }
        : { valid: false, reason: 'empty-key-or-secret' };
    if (credential instanceof OAuth2Credential)
      return credential.reveal().length > 0
        ? { valid: true }
        : { valid: false, reason: 'empty-access-token' };
    return { valid: false, reason: 'unknown-type' };
  }

  /** Parse a compact JWS/JWT into its parts (throws `AuthValidationError` when malformed). */
  parseJwt(token: string): ParsedJwt {
    const parts = token.split('.');
    if (parts.length !== 3)
      throw new AuthValidationError('Malformed JWT: expected three dot-separated segments.');
    const [headerB64, payloadB64, signature] = parts as [string, string, string];
    try {
      const header = JSON.parse(fromUtf8(fromBase64(headerB64))) as JwtHeader;
      const claims = JSON.parse(fromUtf8(fromBase64(payloadB64))) as JwtClaims;
      return { header, claims, signingInput: `${headerB64}.${payloadB64}`, signature };
    } catch (cause) {
      throw new AuthValidationError(`Malformed JWT: ${(cause as Error).message}`);
    }
  }

  /** Validate a JWT's algorithm, signature and time-based claims. */
  validateJwt(token: string, options: JwtValidationOptions): JwtValidationResult {
    let parsed: ParsedJwt;
    try {
      parsed = this.parseJwt(token);
    } catch (error) {
      return { valid: false, reason: (error as AuthValidationError).message };
    }
    const { header, claims } = parsed;
    const allowed = options.algorithms ?? ['HS256'];
    if (!allowed.includes(header.alg))
      return { valid: false, reason: `alg-not-allowed:${header.alg}`, header, claims };

    if (header.alg === 'HS256') {
      if (options.secret === undefined)
        return { valid: false, reason: 'no-secret', header, claims };
      if (
        !this.signatures.verify(
          'HMAC-SHA256',
          options.secret,
          parsed.signingInput,
          parsed.signature,
          'base64url',
        )
      )
        return { valid: false, reason: 'invalid-signature', header, claims };
    } else {
      if (!options.verify)
        return { valid: false, reason: `unsupported-alg:${header.alg}`, header, claims };
      if (!options.verify(parsed))
        return { valid: false, reason: 'invalid-signature', header, claims };
    }

    const nowSec = Math.floor(options.now / 1000);
    const tolerance = options.clockToleranceSec ?? 0;
    if (typeof claims.exp === 'number' && nowSec > claims.exp + tolerance)
      return { valid: false, reason: 'expired', header, claims };
    if (typeof claims.nbf === 'number' && nowSec < claims.nbf - tolerance)
      return { valid: false, reason: 'not-yet-valid', header, claims };

    return { valid: true, header, claims };
  }
}
