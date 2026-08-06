import { describe, it, expect } from 'vitest';
import { canonicalSymbol } from '@platform/market-data-sdk';
import { coverageStatus, latestVersion, qualityGrade } from '../src/domain/derivations';
import { resolve } from '../src/domain/symbol-resolution';
import { createMarketDataService } from '../src/composition';
import { DATASETS, SYMBOLS } from '../src/infrastructure/in-memory/seed';

describe('domain derivations (pure)', () => {
  it('derives coverage status from completeness + gaps', () => {
    expect(coverageStatus(1, 0)).toBe('COMPLETE');
    expect(coverageStatus(0.97, 3)).toBe('PARTIAL');
    expect(coverageStatus(0.4, 2)).toBe('SPARSE');
    expect(coverageStatus(0, 0)).toBe('MISSING');
  });

  it('grades quality deterministically', () => {
    expect(qualityGrade(0.999, 0.999)).toBe('PASS');
    expect(qualityGrade(0.97, 0.999)).toBe('WARN');
    expect(qualityGrade(0.8, 0.9)).toBe('FAIL');
  });

  it('selects the latest dataset version by createdAt', () => {
    const binance = DATASETS.find((dataset) => dataset.id === 'DS-BINANCE-BTC-OHLCV-1m')!;
    expect(latestVersion(binance.versions)?.version).toBe('3.2.0');
    expect(latestVersion([])).toBeNull();
  });
});

describe('symbol resolution (SDK + domain)', () => {
  it('builds a canonical symbol from parts', () => {
    expect(canonicalSymbol({ exchangeCode: 'binance', base: 'btc', quote: 'usdt' })).toBe(
      'BINANCE:BTC-USDT',
    );
    expect(canonicalSymbol({ exchangeCode: 'nasdaq', symbol: 'aapl' })).toBe('NASDAQ:AAPL');
  });

  it('resolves native symbols and aliases case-insensitively', () => {
    expect(resolve('BTCUSDT', SYMBOLS)?.id).toBe('SY-BINANCE-BTC-USDT');
    expect(resolve('btc/usdt', SYMBOLS)?.id).toBe('SY-BINANCE-BTC-USDT');
    expect(resolve('BINANCE:ETH-USDT', SYMBOLS)?.id).toBe('SY-BINANCE-ETH-USDT');
    expect(resolve('unknown', SYMBOLS)).toBeNull();
  });
});

describe('MarketDataService (over in-memory ports)', () => {
  const service = createMarketDataService();

  it('summarizes the registries', async () => {
    const summary = await service.getSummary();
    expect(summary.datasets).toBe(DATASETS.length);
    expect(summary.exchanges).toBeGreaterThan(0);
    expect(summary.activeDatasets).toBe(DATASETS.filter((d) => d.status === 'ACTIVE').length);
  });

  it('resolves symbols through the service', async () => {
    expect((await service.resolveSymbol('aapl'))?.canonical).toBe('NASDAQ:AAPL');
  });

  it('builds coverage, quality and catalog views with derived fields', async () => {
    const coverage = await service.getDataCoverage();
    expect(coverage.find((row) => row.datasetId === 'DS-CME-ES-INDEX')?.status).toBe('MISSING');
    const quality = await service.getDataQualityOverview();
    expect(quality.find((row) => row.datasetId === 'DS-NASDAQ-AAPL-CA')?.grade).toBe('FAIL');
    const catalog = await service.getDataCatalog();
    expect(catalog).toHaveLength(DATASETS.length);
  });

  it('lists time series for a dataset and schedules refresh', async () => {
    expect((await service.getDatasetTimeSeries('DS-BINANCE-BTC-OHLCV-1m')).length).toBeGreaterThan(
      0,
    );
    expect(await service.scheduleRefresh('DS-BINANCE-BTC-OHLCV-1m')).toBe(true);
    expect(await service.scheduleRefresh('nope')).toBe(false);
  });
});
