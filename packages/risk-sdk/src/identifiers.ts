/**
 * Pure Risk Engine identifier + version primitives. Deterministic, no IO. Back the
 * registration, versioning and discovery capabilities — no VaR, no CVaR, no exposure
 * calculation.
 */

/** Canonical fully-qualified assessment key: `namespace/family/name`. */
export function assessmentKey(namespace: string, family: string, name: string): string {
  return `${namespace}/${family}/${name}`.toLowerCase().replace(/\s+/g, '-');
}

/**
 * Compare two dotted semantic versions. Returns >0 when `a` is newer, <0 when older,
 * 0 when equal. Missing segments are treated as 0.
 */
export function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map((part) => Number.parseInt(part, 10) || 0);
  const pb = b.split('.').map((part) => Number.parseInt(part, 10) || 0);
  const length = Math.max(pa.length, pb.length);
  for (let index = 0; index < length; index += 1) {
    const diff = (pa[index] ?? 0) - (pb[index] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

/** The newest version string from a list (by semantic order). */
export function latestVersion(versions: readonly string[]): string | null {
  return versions.reduce<string | null>((best, candidate) => {
    if (best === null) return candidate;
    return compareVersions(candidate, best) > 0 ? candidate : best;
  }, null);
}
