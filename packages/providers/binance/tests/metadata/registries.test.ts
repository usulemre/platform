import { describe, expect, it } from 'vitest';
import { ExchangeMetadataMapper } from '../../src/metadata/metadata-mapper';
import { SymbolRegistry } from '../../src/metadata/symbol-registry';
import { TradingPairRegistry } from '../../src/metadata/trading-pair-registry';
import { AssetRegistry } from '../../src/metadata/asset-registry';
import { ExchangeCapabilityRegistry } from '../../src/metadata/capability-registry';
import { MetadataValidator } from '../../src/metadata/validator';
import { ExchangeMetadataCache } from '../../src/metadata/cache';
import { InMemoryExchangeMetadataRepository } from '../../src/metadata/repository';
import { FixedClock } from '../helpers';
import { SPOT_EXCHANGE_INFO } from './fixtures';
import type { ExchangeMetadata } from '../../src/metadata/types';

const metadata: ExchangeMetadata = new ExchangeMetadataMapper('SPOT').toCanonical(
  SPOT_EXCHANGE_INFO,
  '1970-01-01T00:00:00.000Z',
);
const symbols = metadata.symbols;

describe('SymbolRegistry', () => {
  const registry = new SymbolRegistry(symbols);

  it('resolves by canonical and venue name (case-insensitive)', () => {
    expect(registry.get('BTC-USDT')?.venueSymbol).toBe('BTCUSDT');
    expect(registry.get('btcusdt')?.symbol).toBe('BTC-USDT');
    expect(registry.has('DOGE-USDT')).toBe(false);
  });

  it('filters by status and asset', () => {
    expect(registry.size).toBe(3);
    expect(registry.trading()).toHaveLength(2);
    expect(registry.byStatus('HALT').map((s) => s.venueSymbol)).toEqual(['LUNAUSDT']);
    expect(
      registry
        .byQuoteAsset('USDT')
        .map((s) => s.venueSymbol)
        .sort(),
    ).toEqual(['BTCUSDT', 'LUNAUSDT']);
    expect(registry.byBaseAsset('ETH')).toHaveLength(1);
  });
});

describe('TradingPairRegistry', () => {
  const registry = new TradingPairRegistry(symbols);

  it('indexes pairs by name, base and quote', () => {
    expect(registry.get('ETHBTC')).toMatchObject({ baseAsset: 'ETH', quoteAsset: 'BTC' });
    expect(registry.byQuoteAsset('BTC').map((p) => p.symbol)).toEqual(['ETH-BTC']);
    expect(registry.byBaseAsset('BTC')).toHaveLength(1);
    expect(registry.size).toBe(3);
  });
});

describe('AssetRegistry', () => {
  const registry = new AssetRegistry(symbols);

  it('collects distinct assets with roles and precision', () => {
    expect(registry.has('BTC')).toBe(true);
    expect([...(registry.get('BTC')?.roles ?? [])].sort()).toEqual(['BASE', 'QUOTE']);
    expect(registry.get('USDT')?.roles).toEqual(['QUOTE']);
    expect(
      registry
        .quoteAssets()
        .map((a) => a.asset)
        .sort(),
    ).toEqual(['BTC', 'USDT']);
    expect(
      registry
        .baseAssets()
        .map((a) => a.asset)
        .sort(),
    ).toEqual(['BTC', 'ETH', 'LUNA']);
  });
});

describe('ExchangeCapabilityRegistry', () => {
  const registry = new ExchangeCapabilityRegistry(symbols);

  it('aggregates permissions/order types and per-symbol capability', () => {
    expect(registry.permissions()).toEqual(['MARGIN', 'SPOT']);
    expect(registry.supportsOrderType('MARKET')).toBe(true);
    expect(registry.forSymbol('BTC-USDT')?.marginTradingAllowed).toBe(true);
    // All three symbols carry the SPOT permission (LUNAUSDT is spot-permissioned though halted).
    expect(registry.summary().spotSymbols).toBe(3);
    expect(registry.summary().marginSymbols).toBe(1);
  });
});

describe('MetadataValidator', () => {
  const validator = new MetadataValidator();

  it('accepts a well-formed snapshot', () => {
    const result = validator.validate(metadata);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('rejects a raw payload with no symbols', () => {
    expect(validator.validateRaw({ symbols: [] }).valid).toBe(false);
    expect(validator.validateRaw(undefined).valid).toBe(false);
  });

  it('flags identical base/quote and non-positive increments', () => {
    const broken: ExchangeMetadata = {
      ...metadata,
      symbols: [
        {
          ...symbols[0]!,
          baseAsset: 'BTC',
          quoteAsset: 'BTC',
          precision: { ...symbols[0]!.precision, tickSize: 0 },
        },
      ],
    };
    const result = validator.validate(broken);
    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toMatch(/identical|tick/i);
  });
});

describe('ExchangeMetadataCache + Repository', () => {
  it('honours TTL and stores per market', () => {
    const clock = new FixedClock(0);
    const cache = new ExchangeMetadataCache({ clock: clock.now, ttlMs: 1_000 });
    expect(cache.isFresh()).toBe(false);
    cache.set(metadata);
    expect(cache.isFresh()).toBe(true);
    clock.advance(2_000);
    expect(cache.isFresh()).toBe(false);
    expect(cache.get()).toBe(metadata);

    const repo = new InMemoryExchangeMetadataRepository();
    repo.save(metadata);
    expect(repo.load('SPOT')).toBe(metadata);
    expect(repo.markets()).toEqual(['SPOT']);
  });
});
