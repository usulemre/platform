/**
 * The signing framework. `SignatureService` holds a registry of `Signer`s keyed by algorithm and
 * exposes `sign`/`verify`. HMAC-SHA256 is implemented for real (deterministic, pure); RSA-SHA256 and
 * ECDSA-SHA256 are *foundations* — registered as placeholders that throw `AuthNotSupportedError` until
 * a concrete adapter is injected. Verification uses a constant-time comparison. No provider-specific
 * canonicalization lives here.
 */
import { constantTimeEqual, hmacSha256, toBase64, toBase64Url, toHex, utf8 } from './crypto';
import { AuthNotSupportedError } from './errors';

export type SignatureAlgorithmId = 'HMAC-SHA256' | 'RSA-SHA256' | 'ECDSA-SHA256';
export type SignatureEncoding = 'hex' | 'base64' | 'base64url';

/** A key is either raw bytes or a UTF-8 string (encoded to bytes by the signer). */
export type SigningKey = string | Uint8Array;

export interface Signer {
  readonly algorithm: SignatureAlgorithmId;
  sign(key: SigningKey, message: string, encoding: SignatureEncoding): string;
  verify(key: SigningKey, message: string, signature: string, encoding: SignatureEncoding): boolean;
}

function keyBytes(key: SigningKey): Uint8Array {
  return typeof key === 'string' ? utf8(key) : key;
}
function encode(mac: Uint8Array, encoding: SignatureEncoding): string {
  return encoding === 'hex' ? toHex(mac) : encoding === 'base64' ? toBase64(mac) : toBase64Url(mac);
}

/** The real HMAC-SHA256 signer. */
export class HmacSha256Signer implements Signer {
  readonly algorithm = 'HMAC-SHA256';
  sign(key: SigningKey, message: string, encoding: SignatureEncoding): string {
    return encode(hmacSha256(keyBytes(key), utf8(message)), encoding);
  }
  verify(
    key: SigningKey,
    message: string,
    signature: string,
    encoding: SignatureEncoding,
  ): boolean {
    return constantTimeEqual(utf8(this.sign(key, message, encoding)), utf8(signature));
  }
}

/** A foundation signer that refuses to operate until a real implementation is injected. */
class UnsupportedSigner implements Signer {
  constructor(readonly algorithm: SignatureAlgorithmId) {}
  sign(): string {
    throw new AuthNotSupportedError(this.algorithm);
  }
  verify(): boolean {
    throw new AuthNotSupportedError(this.algorithm);
  }
}

export class SignatureService {
  private readonly signers = new Map<SignatureAlgorithmId, Signer>();

  constructor() {
    this.register(new HmacSha256Signer());
    this.register(new UnsupportedSigner('RSA-SHA256'));
    this.register(new UnsupportedSigner('ECDSA-SHA256'));
  }

  /** Register (or replace) a signer for its algorithm. */
  register(signer: Signer): this {
    this.signers.set(signer.algorithm, signer);
    return this;
  }

  /** Whether an algorithm has a working (non-foundation) signer. */
  supports(algorithm: SignatureAlgorithmId): boolean {
    const signer = this.signers.get(algorithm);
    return signer !== undefined && !(signer instanceof UnsupportedSigner);
  }

  algorithms(): readonly SignatureAlgorithmId[] {
    return [...this.signers.keys()];
  }

  sign(
    algorithm: SignatureAlgorithmId,
    key: SigningKey,
    message: string,
    encoding: SignatureEncoding = 'hex',
  ): string {
    return this.signer(algorithm).sign(key, message, encoding);
  }

  verify(
    algorithm: SignatureAlgorithmId,
    key: SigningKey,
    message: string,
    signature: string,
    encoding: SignatureEncoding = 'hex',
  ): boolean {
    return this.signer(algorithm).verify(key, message, signature, encoding);
  }

  private signer(algorithm: SignatureAlgorithmId): Signer {
    const signer = this.signers.get(algorithm);
    if (!signer) throw new AuthNotSupportedError(algorithm);
    return signer;
  }
}
