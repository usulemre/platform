import { describe, it, expect } from 'vitest';
import { ASSET_CLASSES, MARKET_DATA_TYPES, canonicalSymbol } from '@platform/market-data-sdk';
import { applyDatasetQuery, applySymbolQuery } from '../src/modules/market-data/domain/query';
import {
  toDatasetDetailVm,
  toDatasetListItemVm,
  toSummaryVm,
} from '../src/modules/market-data/domain/mappers';
import { MarketDataService } from '../src/modules/market-data/application/market-data-service';
import {
  MARKET_DATA_SEED,
  MockMarketDataRepository,
} from '../src/modules/market-data/data/mock-repository';

const { assets, exchanges, symbols, datasets } = MARKET_DATA_SEED;

describe('@platform/market-data-sdk vocabulary is shared', () => {
  it('exposes nine asset classes and thirteen market-data types', () => {
    expect(ASSET_CLASSES).toHaveLength(9);
    expect(MARKET_DATA_TYPES).toHaveLength(13);
    expect(canonicalSymbol({ exchangeCode: 'binance', base: 'btc', quote: 'usdt' })).toBe(
      'BINANCE:BTC-USDT',
    );
  });
});

describe('pure queries', () => {
  it('filters symbols by asset class and resolves native/alias in search', () => {
    expect(
      applySymbolQuery(symbols, { assetClass: 'CRYPTO' }).every((s) => s.assetClass === 'CRYPTO'),
    ).toBe(true);
    expect(applySymbolQuery(symbols, { search: 'btcusdt' })).toHaveLength(1);
  });

  it('filters datasets by type and status', () => {
    expect(
      applyDatasetQuery(datasets, { marketDataType: 'OHLCV' }).every(
        (d) => d.marketDataType === 'OHLCV',
      ),
    ).toBe(true);
    expect(
      applyDatasetQuery(datasets, { status: 'DEPRECATED' }).every((d) => d.status === 'DEPRECATED'),
    ).toBe(true);
  });
});

describe('mappers (pure DTO → VM)', () => {
  const binance = datasets[0]!;

  it('maps a dataset list item with coverage/quality tones', () => {
    const vm = toDatasetListItemVm(binance);
    expect(vm.status.tone).toBe('positive');
    expect(vm.coverage.label).toBe('Complete');
    expect(vm.quality.label).toBe('Pass');
  });

  it('maps a dataset detail with formatted coverage range and versions', () => {
    const vm = toDatasetDetailVm(binance);
    expect(vm.coverage.completeness).toBe('100.0%');
    expect(vm.coverage.range).toContain('→');
    expect(vm.versions.length).toBeGreaterThan(0);
  });

  it('summarizes into asset-class and market-data-type buckets', () => {
    const summary = toSummaryVm(assets, exchanges, symbols, datasets);
    expect(summary.datasets).toBe(datasets.length);
    expect(summary.byAssetClass.every((b) => b.count > 0)).toBe(true);
    expect(summary.byMarketDataType.every((b) => b.count > 0)).toBe(true);
  });
});

describe('MarketDataService (over the mock repository)', () => {
  const service = new MarketDataService(new MockMarketDataRepository());

  it('lists registries as view models', async () => {
    expect(await service.listSymbols()).toHaveLength(symbols.length);
    expect(await service.listExchanges()).toHaveLength(exchanges.length);
    expect(await service.listAssets()).toHaveLength(assets.length);
  });

  it('bundles a dataset with its time series', async () => {
    const bundle = await service.getDataset('DS-BINANCE-BTC-OHLCV-1m');
    expect(bundle).not.toBeNull();
    expect(bundle!.timeSeries.length).toBeGreaterThan(0);
    expect(await service.getDataset('nope')).toBeNull();
  });

  it('bundles a symbol with its datasets and series', async () => {
    const bundle = await service.getSymbol('SY-NASDAQ-AAPL');
    expect(bundle!.datasets.length).toBeGreaterThan(0);
  });

  it('builds coverage, quality, catalog, calendar and sessions', async () => {
    expect(await service.getDataCoverage()).toHaveLength(datasets.length);
    expect(await service.getDataQualityOverview()).toHaveLength(datasets.length);
    const catalog = await service.getCatalog();
    expect(
      catalog.find((entry) => entry.datasetId === 'DS-BINANCE-BTC-OHLCV-1m')?.latestVersion,
    ).toBe('3.2.0');
    expect((await service.getCalendar()).events.length).toBeGreaterThan(0);
    expect((await service.getSessions()).length).toBeGreaterThan(0);
  });
});
