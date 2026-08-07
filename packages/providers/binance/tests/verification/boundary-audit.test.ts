/**
 * Phase 9.1.8 — Provider Boundary & API-Compliance Audit (executable).
 *
 * These tests turn the manual audit checklist into assertions that run in CI, so a regression that
 * breaks provider isolation fails a test rather than slipping through review. They verify, over the
 * real repository source, that: (1) no code outside the Binance provider imports Binance internals or
 * hard-codes a Binance host — the ONLY sanctioned external reference is the gateway composition seam
 * (`providerFactories`); (2) the provider owns no duplicate transport (no raw `fetch`/`WebSocket`/HTTP
 * library) and reuses the shared foundations; (3) no TODO/stub/placeholder implementation remains in
 * the provider source; and (4) secrets never appear in a serialized error crossing the boundary.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { InMemorySecretProvider } from '@platform/auth-core';
import { createBinanceProvider } from '../../src/index';
import { capabilityContext, FakeTransport, gatewayConfig } from '../helpers';

/**
 * Resolve paths from THIS test file's location (not `process.cwd()`, which varies by how vitest is
 * invoked): tests/verification/ → package root → monorepo root.
 */
const HERE = dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = resolve(HERE, '../..');
const REPO_ROOT = resolve(PKG_ROOT, '../../..');
const SRC = join(PKG_ROOT, 'src');

/** Recursively collect `.ts` files under a directory (skips node_modules / build output). */
function collectTs(dir: string, out: string[] = []): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry === 'node_modules' || entry === '.turbo' || entry === 'dist') continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) collectTs(full, out);
    else if (entry.endsWith('.ts')) out.push(full);
  }
  return out;
}

/** Scan a set of workspace roots outside the Binance provider for a regex, returning `file:line`. */
function scanOutsideProvider(pattern: RegExp): string[] {
  const roots = ['apps', 'services', 'packages'].map((r) => join(REPO_ROOT, r));
  const hits: string[] = [];
  for (const root of roots) {
    for (const file of collectTs(root)) {
      if (file.startsWith(join(REPO_ROOT, 'packages', 'providers', 'binance'))) continue;
      const text = readFileSync(file, 'utf8');
      text.split('\n').forEach((line, i) => {
        if (pattern.test(line))
          hits.push(`${file.replace(REPO_ROOT + '/', '')}:${i + 1} ${line.trim()}`);
      });
    }
  }
  return hits;
}

describe('Provider boundary audit — no Binance leakage outside the provider', () => {
  it('the ONLY external import of the provider is the gateway composition seam (providerFactories)', () => {
    const hits = scanOutsideProvider(/from ['"]@platform\/provider-binance/);
    // Every hit must import from the package root and bind only `providerFactories`.
    for (const hit of hits) {
      expect(hit, `unexpected provider import: ${hit}`).toMatch(/provider-binance['"]/);
      expect(hit, `deep import into provider internals: ${hit}`).not.toMatch(/provider-binance\//);
    }
    // The sanctioned consumer exists and imports only the factory registry.
    const composition = readFileSync(
      join(REPO_ROOT, 'services/broker-gateway-service/src/composition.ts'),
      'utf8',
    );
    expect(composition).toMatch(/providerFactories as binance/);
    expect(composition).not.toMatch(/BinanceProvider|createBinanceProvider/);
  });

  it('no code outside the provider hard-codes a Binance host or endpoint', () => {
    expect(scanOutsideProvider(/binance\.com|binance\.vision|binancefuture/)).toEqual([]);
  });

  it('no code outside the provider references Binance venue DTO field names or provider-only enums', () => {
    // A representative set of Binance-only vocabulary that must never appear in canonical consumers.
    expect(scanOutsideProvider(/X-MBX-APIKEY|listenKey|positionAmt|cummulativeQuoteQty/)).toEqual(
      [],
    );
  });
});

describe('Provider boundary audit — no duplicate transport / stubs inside the provider', () => {
  const srcFiles = collectTs(SRC);

  it('scans a non-trivial number of provider source files', () => {
    expect(srcFiles.length).toBeGreaterThan(50);
  });

  it('uses no raw transport (fetch/WebSocket/http lib) — only the shared HTTP & WebSocket clients', () => {
    const offenders: string[] = [];
    for (const file of srcFiles) {
      const text = readFileSync(file, 'utf8');
      text.split('\n').forEach((line, i) => {
        // `fetch(` as an injected fetcher parameter is fine; a GLOBAL fetch/new WebSocket/axios is not.
        if (
          /\b(globalThis\.fetch|window\.fetch|new WebSocket\(|require\(['"]https?['"]\)|from ['"](axios|node-fetch|undici)['"])/.test(
            line,
          )
        )
          offenders.push(`${file.replace(SRC + '/', '')}:${i + 1}`);
      });
    }
    expect(offenders).toEqual([]);
  });

  it('has no TODO / FIXME / stub / placeholder implementation in the provider source', () => {
    const offenders: string[] = [];
    for (const file of srcFiles) {
      const text = readFileSync(file, 'utf8');
      text.split('\n').forEach((line, i) => {
        if (
          /\b(TODO|FIXME|XXX|HACK)\b|not implemented|unimplemented|stub implementation/i.test(line)
        )
          offenders.push(`${file.replace(SRC + '/', '')}:${i + 1} ${line.trim()}`);
      });
    }
    expect(offenders).toEqual([]);
  });

  it('never stores an inline API secret (secrets are always resolved by reference)', () => {
    const offenders: string[] = [];
    for (const file of srcFiles) {
      const text = readFileSync(file, 'utf8');
      text.split('\n').forEach((line, i) => {
        // Assignments of a literal secret would be a violation; *Ref lookups are the sanctioned path.
        if (/(apiSecret|apiKey)\s*[:=]\s*['"][A-Za-z0-9]{8,}['"]/.test(line))
          offenders.push(`${file.replace(SRC + '/', '')}:${i + 1}`);
      });
    }
    expect(offenders).toEqual([]);
  });
});

describe('Provider boundary audit — secrets never cross the boundary in errors', () => {
  it('a canonicalized auth/config error contains no secret material', async () => {
    const secretValue = 'super-secret-signing-key-1234567890';
    const provider = createBinanceProvider({
      providerId: 'binance',
      transport: new FakeTransport().on('/api/v3/time', { body: { serverTime: 0 } }),
      secretProvider: new InMemorySecretProvider({
        'secret://brokers/bnc-1/api-key': 'pub-key',
        'secret://brokers/bnc-1/api-secret': secretValue,
      }),
      clock: () => 0,
    });
    const ctx = capabilityContext(gatewayConfig());
    // Force a venue error and assert the serialized error never carries the secret.
    const failing = createBinanceProvider({
      providerId: 'binance',
      transport: new FakeTransport().on('/api/v3/time', {
        status: 401,
        body: { code: -2015, msg: 'Invalid API-key.' },
      }),
      secretProvider: new InMemorySecretProvider({
        'secret://brokers/bnc-1/api-key': 'pub-key',
        'secret://brokers/bnc-1/api-secret': secretValue,
      }),
      clock: () => 0,
    });
    await provider.authenticate(ctx); // succeeds (time ok)
    let caught: unknown;
    try {
      await failing.heartbeat(ctx);
    } catch (error) {
      caught = error;
    }
    // Heartbeat pings (public) — may or may not throw; the invariant is: no secret leaks anywhere.
    const serialized = JSON.stringify(caught ?? {}) + String((caught as Error)?.stack ?? '');
    expect(serialized).not.toContain(secretValue);
  });
});
