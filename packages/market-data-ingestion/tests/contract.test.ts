import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  InMemoryMarketDataStore,
  ManualClock,
  MarketDataIngestionGateway,
  type MarketDataConsumer,
  type NormalizedMarketDataRecord,
  type ProviderMarketDataSource,
} from '../src/index';
import { T0, makeRegistry, trade } from './helpers';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');

/** Recursively collect every .ts source file. */
function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...sourceFiles(full));
    else if (entry.name.endsWith('.ts')) out.push(full);
  }
  return out;
}

/** Extract the module specifiers of every import/export-from statement. */
function importSpecifiers(code: string): string[] {
  const specifiers: string[] = [];
  const regex = /(?:import|export)[^'"]*?from\s*['"]([^'"]+)['"]/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(code)) !== null) {
    if (match[1]) specifiers.push(match[1]);
  }
  return specifiers;
}

describe('provider isolation (architectural acceptance criterion)', () => {
  const files = sourceFiles(SRC);

  it('the ingestion core imports no provider package or provider-specific module', () => {
    const offenders: string[] = [];
    for (const file of files) {
      for (const spec of importSpecifiers(readFileSync(file, 'utf8'))) {
        // Only external (bare) module specifiers can couple us to a provider; relative imports
        // (./, ../) are the ingestion core's own modules.
        if (spec.startsWith('.')) continue;
        const lowered = spec.toLowerCase();
        if (
          lowered.includes('provider') ||
          lowered.includes('binance') ||
          lowered.includes('broker') ||
          lowered.includes('websocket-client') ||
          lowered.includes('http-client') ||
          lowered.includes('alpaca') ||
          lowered.includes('deribit') ||
          lowered.includes('interactive-brokers')
        ) {
          offenders.push(`${file}: ${spec}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('only depends on the canonical shared SDKs', () => {
    const allowedExternal = new Set(['@platform/market-data-sdk', '@platform/types']);
    const externalImports = new Set<string>();
    for (const file of files) {
      for (const spec of importSpecifiers(readFileSync(file, 'utf8'))) {
        if (spec.startsWith('@platform/')) externalImports.add(spec);
      }
    }
    for (const spec of externalImports) {
      expect(allowedExternal.has(spec), `unexpected cross-package import: ${spec}`).toBe(true);
    }
  });
});

describe('provider contract conformance', () => {
  it('any object satisfying ProviderMarketDataSource can drive the gateway', async () => {
    const clock = new ManualClock(T0);
    const store = new InMemoryMarketDataStore();
    const gateway = new MarketDataIngestionGateway({ store, registry: makeRegistry(), clock });

    // A brand-new, non-Binance provider adapter — no ingestion-core change required.
    class GenericVenue implements ProviderMarketDataSource {
      readonly providerId = 'binance';
      private sink: MarketDataConsumer | undefined;
      start(consumer: MarketDataConsumer): void {
        this.sink = consumer;
      }
      stop(): void {
        this.sink = undefined;
      }
      feed(): Promise<unknown> {
        return this.sink!.ingest({ providerId: this.providerId, event: trade() });
      }
    }

    const venue = new GenericVenue();
    await gateway.connect(venue);
    await venue.feed();
    await gateway.flush();
    const records: readonly NormalizedMarketDataRecord[] = store.all();
    expect(records.length).toBe(1);
    // The stored record is fully canonical: no venue field names leak.
    expect(Object.keys(records[0] ?? {})).toEqual(
      expect.arrayContaining([
        'instrumentId',
        'kind',
        'marketDataType',
        'timestamps',
        'provenance',
      ]),
    );
  });
});
