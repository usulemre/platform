import { describe, it, expect } from 'vitest';
import {
  constantTimeEqual,
  fromBase64,
  fromUtf8,
  hmacSha256,
  sha256,
  toBase64,
  toBase64Url,
  toHex,
  utf8,
} from '../src/crypto';

describe('sha256 (NIST vectors)', () => {
  it('hashes the empty string and "abc"', () => {
    expect(toHex(sha256(utf8('')))).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    );
    expect(toHex(sha256(utf8('abc')))).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });
  it('hashes a two-block message', () => {
    expect(toHex(sha256(utf8('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq')))).toBe(
      '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1',
    );
  });
});

describe('hmac-sha256 (RFC vectors)', () => {
  it('matches the classic "quick brown fox" vector', () => {
    expect(
      toHex(hmacSha256(utf8('key'), utf8('The quick brown fox jumps over the lazy dog'))),
    ).toBe('f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8');
  });
  it('handles a long key (> block size)', () => {
    const key = new Uint8Array(131).fill(0xaa);
    const mac = hmacSha256(key, utf8('Test Using Larger Than Block-Size Key - Hash Key First'));
    expect(toHex(mac)).toBe('60e431591ee0b67f0d8a26aacbf5b77f8e0bc6213728c5140546040f0ee37f54');
  });
});

describe('encoding', () => {
  it('round-trips base64 and base64url', () => {
    const bytes = Uint8Array.from([0, 1, 2, 250, 251, 252, 253, 254, 255]);
    expect(fromBase64(toBase64(bytes))).toEqual(bytes);
    expect(fromBase64(toBase64Url(bytes))).toEqual(bytes);
    expect(toBase64Url(utf8('{"alg":"HS256"}'))).toBe('eyJhbGciOiJIUzI1NiJ9');
    expect(fromUtf8(fromBase64('eyJhbGciOiJIUzI1NiJ9'))).toBe('{"alg":"HS256"}');
  });
  it('compares in constant time', () => {
    expect(constantTimeEqual(utf8('abc'), utf8('abc'))).toBe(true);
    expect(constantTimeEqual(utf8('abc'), utf8('abd'))).toBe(false);
    expect(constantTimeEqual(utf8('abc'), utf8('ab'))).toBe(false);
  });
});
