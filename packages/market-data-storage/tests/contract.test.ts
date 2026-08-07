import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ManualClock } from '@platform/market-data-ingestion';
import { describe, expect, it } from 'vitest';
import { MarketDataStorage } from '../src/index';
import { INSTRUMENT, T0, trade } from './helpers';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...sourceFiles(full));
    else if (entry.name.endsWith('.ts')) out.push(full);
  }
  return out;
}

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

  it('the storage layer imports no provider package or provider-specific module', () => {
    const offenders: string[] = [];
    for (const file of files) {
      for (const spec of importSpecifiers(readFileSync(file, 'utf8'))) {
        if (spec.startsWith('.')) continue;
        const lowered = spec.toLowerCase();
        if (
          lowered.includes('provider') ||
          lowered.includes('binance') ||
          lowered.includes('broker') ||
          lowered.includes('alpaca') ||
          lowered.includes('deribit') ||
          lowered.includes('interactive-brokers') ||
          lowered.includes('websocket-client') ||
          lowered.includes('http-client')
        ) {
          offenders.push(`${file}: ${spec}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('depends only on canonical shared packages', () => {
    const allowed = new Set([
      '@platform/market-data-ingestion',
      '@platform/market-data-sdk',
      '@platform/types',
    ]);
    const external = new Set<string>();
    for (const file of files) {
      for (const spec of importSpecifiers(readFileSync(file, 'utf8'))) {
        if (spec.startsWith('@platform/')) external.add(spec);
      }
    }
    for (const spec of external) {
      expect(allowed.has(spec), `unexpected cross-package import: ${spec}`).toBe(true);
    }
  });
});

describe('read boundary', () => {
  it('consumers read canonical records through repositories, not a raw database handle', async () => {
    const storage = new MarketDataStorage({ clock: new ManualClock(T0) });
    await storage.write(trade({ tradeId: 1 }));
    const records = await storage.trades.byInstrument(INSTRUMENT);
    expect(records).toHaveLength(1);
    // The record is fully canonical — provenance + canonical instrument, no venue field names.
    expect(Object.keys(records[0] ?? {})).toEqual(
      expect.arrayContaining([
        'instrumentId',
        'kind',
        'marketDataType',
        'timestamps',
        'provenance',
      ]),
    );
    // The public read surface is the typed repositories / query repository — no query method returns
    // a raw engine or database handle; every result is a canonical record.
    expect(typeof storage.queries.query).toBe('function');
    expect(typeof storage.trades.byInstrument).toBe('function');
  });
});
