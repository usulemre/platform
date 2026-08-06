/**
 * Byte/string encoding primitives — UTF-8, hex and base64/base64url — plus a constant-time comparison.
 * Pure and dependency-free (no Node `Buffer`, no runtime crypto), so results are identical everywhere
 * and fully deterministic. These are the building blocks the signing and JWT layers rely on.
 */

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/** Encode a string to its UTF-8 bytes. */
export function utf8(text: string): Uint8Array {
  return encoder.encode(text);
}

/** Decode UTF-8 bytes back to a string. */
export function fromUtf8(bytes: Uint8Array): string {
  return decoder.decode(bytes);
}

const HEX = '0123456789abcdef';

/** Lower-case hex encoding. */
export function toHex(bytes: Uint8Array): string {
  let out = '';
  for (const byte of bytes) out += HEX[byte >> 4]! + HEX[byte & 0x0f]!;
  return out;
}

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const B64_LOOKUP = ((): Int16Array => {
  const table = new Int16Array(128).fill(-1);
  for (let i = 0; i < B64.length; i += 1) table[B64.charCodeAt(i)] = i;
  table['='.charCodeAt(0)] = -2;
  return table;
})();

/** Standard base64 encoding. */
export function toBase64(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i]!;
    const b1 = i + 1 < bytes.length ? bytes[i + 1]! : 0;
    const b2 = i + 2 < bytes.length ? bytes[i + 2]! : 0;
    out += B64[b0 >> 2]!;
    out += B64[((b0 & 0x03) << 4) | (b1 >> 4)]!;
    out += i + 1 < bytes.length ? B64[((b1 & 0x0f) << 2) | (b2 >> 6)]! : '=';
    out += i + 2 < bytes.length ? B64[b2 & 0x3f]! : '=';
  }
  return out;
}

/** Base64url encoding (RFC 4648 §5), no padding. */
export function toBase64Url(bytes: Uint8Array): string {
  return toBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Decode standard or URL-safe base64 to bytes. */
export function fromBase64(input: string): Uint8Array {
  const clean = input.replace(/-/g, '+').replace(/_/g, '/');
  const out: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (const ch of clean) {
    const value = B64_LOOKUP[ch.charCodeAt(0)] ?? -1;
    if (value === -2 || value === -1) continue; // padding or non-alphabet
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out.push((buffer >> bits) & 0xff);
    }
  }
  return Uint8Array.from(out);
}

/**
 * Constant-time byte comparison — does not short-circuit on the first mismatch, so it cannot leak the
 * position of a difference via timing when comparing signatures/MACs.
 */
export function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a[i]! ^ b[i]!;
  return diff === 0;
}

/** Best-effort in-place wipe of a mutable byte buffer (zero-copy hygiene for transient secrets). */
export function wipe(bytes: Uint8Array): void {
  bytes.fill(0);
}
