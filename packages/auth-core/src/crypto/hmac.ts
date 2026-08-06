/**
 * HMAC-SHA256 (RFC 2104) built on the pure SHA-256. Deterministic and dependency-free. Returns the raw
 * 32-byte MAC; the signing layer encodes it as hex or base64 as required. Verified against RFC 4231
 * test vectors.
 */
import { sha256, SHA256_BLOCK_SIZE } from './sha256';

/** Compute HMAC-SHA256 of `message` under `key` (raw 32-byte MAC). */
export function hmacSha256(key: Uint8Array, message: Uint8Array): Uint8Array {
  const blockKey = new Uint8Array(SHA256_BLOCK_SIZE);
  if (key.length > SHA256_BLOCK_SIZE) blockKey.set(sha256(key));
  else blockKey.set(key);

  const inner = new Uint8Array(SHA256_BLOCK_SIZE + message.length);
  const outerPrefix = new Uint8Array(SHA256_BLOCK_SIZE);
  for (let i = 0; i < SHA256_BLOCK_SIZE; i += 1) {
    inner[i] = blockKey[i]! ^ 0x36;
    outerPrefix[i] = blockKey[i]! ^ 0x5c;
  }
  inner.set(message, SHA256_BLOCK_SIZE);
  const innerHash = sha256(inner);

  const outer = new Uint8Array(SHA256_BLOCK_SIZE + innerHash.length);
  outer.set(outerPrefix);
  outer.set(innerHash, SHA256_BLOCK_SIZE);
  return sha256(outer);
}
