/**
 * Deterministic content hashing for signal results (FNV-1a, 32-bit). No dependencies, no
 * randomness — the same inputs always produce the same digest, which anchors the reproducibility
 * of a computed signal (RP-1) and the result-registry / cache keys.
 */

/** FNV-1a over a byte view. */
function fnv1a(bytes: Uint8Array, seed = 0x811c9dc5): number {
  let hash = seed >>> 0;
  for (let i = 0; i < bytes.length; i += 1) {
    hash ^= bytes[i]!;
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** FNV-1a over a UTF-8 string. */
export function hashString(text: string, seed?: number): number {
  const bytes = new TextEncoder().encode(text);
  return fnv1a(bytes, seed);
}

/** Deterministic digest of a `Float64Array` (hashes its raw little-endian bytes). */
export function hashFloat64(values: Float64Array): number {
  const bytes = new Uint8Array(values.buffer, values.byteOffset, values.byteLength);
  return fnv1a(bytes);
}

/** A stable manifest hash for a computed signal: `signal:params:inputHash:outputHash` → hex. */
export function manifestHash(
  signalKey: string,
  params: Readonly<Record<string, number>>,
  inputHash: number,
  outputHash: number,
): string {
  const paramStr = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join(',');
  const combined = hashString(`${signalKey}|${paramStr}|${inputHash}|${outputHash}`);
  return `fnv:${combined.toString(16).padStart(8, '0')}`;
}

/** A stable cache key for a signal computation over a dataset. */
export function cacheKey(
  signalKey: string,
  params: Readonly<Record<string, number>>,
  datasetRef: string,
): string {
  const paramStr = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join(',');
  return `${datasetRef}::${signalKey}::${paramStr}`;
}
